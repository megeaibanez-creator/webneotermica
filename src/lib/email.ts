import nodemailer from "nodemailer";
import { EMPRESA, SITE_URL } from "@/lib/site";

/**
 * Par de correos del formulario (molde Tricholand):
 *   1. aviso interno a MAIL_TO
 *   2. confirmación al visitante
 * Tablas de 600 px, colores slate/crimson, sin imágenes externas.
 *
 * Sin SMTP_PASS no se envía nada y NO se rompe el alta: la fila ya está guardada.
 */

export type Lead = {
  name: string;
  email: string;
  phone: string;
  contact_type: "particular" | "professional";
  company: string;
  municipio: string;
  service_interest: string;
  budget_range: string;
  referral_source: string;
  message: string;
};

const SLATE = "#597D95";
const CRIMSON = "#CB0A3D";
const INK = "#16202b";

function esc(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function shell(titulo: string, cuerpo: string): string {
  return `<!DOCTYPE html>
<html lang="es"><head><meta charset="utf-8"><title>${esc(titulo)}</title></head>
<body style="margin:0;padding:24px 0;background:#f5f8fb;font-family:Arial,Helvetica,sans-serif;color:${INK}">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" align="center" style="width:600px;max-width:100%;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #e2e9f0">
  <tr><td style="background:${SLATE};padding:20px 28px;color:#ffffff;font-size:18px;font-weight:bold">Neotérmica Climatización</td></tr>
  <tr><td style="height:4px;background:${CRIMSON};font-size:0;line-height:0">&nbsp;</td></tr>
  <tr><td style="padding:28px">${cuerpo}</td></tr>
  <tr><td style="padding:18px 28px;background:#eef3f8;font-size:12px;color:#5c6b7a">
    ${esc(EMPRESA.telefono)} · ${esc(EMPRESA.email)} · ${esc(EMPRESA.horario)}<br>
    Murcia y unos 50 km a la redonda · <a href="${SITE_URL}" style="color:${SLATE}">${SITE_URL}</a>
  </td></tr>
</table></body></html>`;
}

function fila(label: string, valor: string): string {
  if (!valor) return "";
  return `<tr>
    <td style="padding:7px 0;font-size:13px;color:#5c6b7a;width:38%">${esc(label)}</td>
    <td style="padding:7px 0;font-size:14px;color:${INK}"><b>${esc(valor)}</b></td>
  </tr>`;
}

export function plantillaAviso(lead: Lead): { subject: string; html: string } {
  const tipo = lead.contact_type === "professional" ? "Empresa" : "Particular";
  const cuerpo = `
    <h1 style="margin:0 0 6px;font-size:20px;color:${INK}">Nuevo contacto desde la web</h1>
    <p style="margin:0 0 18px;font-size:14px;color:#5c6b7a">${tipo}${
      lead.service_interest ? ` · ${esc(lead.service_interest)}` : ""
    }</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${fila("Nombre", lead.name)}
      ${fila("Empresa", lead.company)}
      ${fila("Teléfono", lead.phone)}
      ${fila("Email", lead.email)}
      ${fila("Municipio", lead.municipio)}
      ${fila("Servicio", lead.service_interest)}
      ${fila("Presupuesto", lead.budget_range)}
      ${fila("Nos conoció por", lead.referral_source)}
    </table>
    ${
      lead.message
        ? `<p style="margin:18px 0 6px;font-size:13px;color:#5c6b7a">Mensaje</p>
           <div style="padding:14px;background:#f5f8fb;border-left:3px solid ${CRIMSON};font-size:14px;white-space:pre-wrap">${esc(
             lead.message
           )}</div>`
        : ""
    }
    <p style="margin:22px 0 0;font-size:13px">
      <a href="tel:${esc(lead.phone)}" style="color:${CRIMSON};font-weight:bold">Llamar</a> ·
      <a href="mailto:${esc(lead.email)}" style="color:${SLATE};font-weight:bold">Responder</a> ·
      <a href="${SITE_URL}/administrator/contactos" style="color:${SLATE}">Ver en el panel</a>
    </p>`;
  return {
    subject: `Contacto web · ${lead.name}${
      lead.budget_range ? ` · ${lead.budget_range}` : ""
    }${lead.service_interest ? ` · ${lead.service_interest}` : ""}`,
    html: shell("Nuevo contacto", cuerpo),
  };
}

export function plantillaConfirmacion(lead: Lead): { subject: string; html: string } {
  const cuerpo = `
    <h1 style="margin:0 0 12px;font-size:20px;color:${INK}">Hemos recibido tu mensaje</h1>
    <p style="margin:0 0 14px;font-size:14px;line-height:1.6">Hola ${esc(
      lead.name.split(" ")[0] ?? lead.name
    )}, gracias por escribir a Neotérmica. Te contestamos en cuanto podamos, dentro del horario de taller: ${esc(
      EMPRESA.horario
    )}.</p>
    ${
      lead.message
        ? `<p style="margin:0 0 6px;font-size:13px;color:#5c6b7a">Esto es lo que nos has contado</p>
           <div style="padding:14px;background:#f5f8fb;border-left:3px solid ${SLATE};font-size:14px;white-space:pre-wrap">${esc(
             lead.message
           )}</div>`
        : ""
    }
    <p style="margin:18px 0 0;font-size:14px;line-height:1.6">Si es urgente, llámanos al <a href="tel:678495046" style="color:${CRIMSON};font-weight:bold">${esc(
      EMPRESA.telefono
    )}</a> o escríbenos por WhatsApp al mismo número.</p>`;
  return {
    subject: "Hemos recibido tu mensaje · Neotérmica",
    html: shell("Hemos recibido tu mensaje", cuerpo),
  };
}

export function smtpConfigurado(): boolean {
  return Boolean(
    process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASS &&
      process.env.MAIL_TO
  );
}

/** Envía el par. Devuelve false si no hay SMTP o si falla (sin romper el alta). */
export async function enviarParDeCorreos(lead: Lead): Promise<boolean> {
  if (!smtpConfigurado()) return false;

  const port = Number(process.env.SMTP_PORT ?? 465);
  const transport = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER as string,
      pass: process.env.SMTP_PASS as string,
    },
  });

  const from = process.env.SMTP_FROM ?? `Neotérmica <${EMPRESA.email}>`;
  const aviso = plantillaAviso(lead);
  const confirmacion = plantillaConfirmacion(lead);

  try {
    await transport.sendMail({
      from,
      to: process.env.MAIL_TO as string,
      replyTo: lead.email,
      subject: aviso.subject,
      html: aviso.html,
    });
    if (lead.email) {
      await transport.sendMail({
        from,
        to: lead.email,
        subject: confirmacion.subject,
        html: confirmacion.html,
      });
    }
    return true;
  } catch (error) {
    console.error("[email] fallo al enviar el par de correos:", error);
    return false;
  }
}
