import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { insertarLocal, localDbActivo } from "@/lib/db/local";
import { detectarSpam } from "@/lib/spam";
import { enviarParDeCorreos, smtpConfigurado, type Lead } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = Partial<Lead> & {
  gdpr_consent?: boolean;
  website?: string;
  form_started_at?: number;
};

/** Fila tal cual entra en `contact_submissions`. Ojo: la columna es `source`. */
type FilaLead = {
  name: string;
  email: string;
  phone: string;
  contact_type: "particular" | "professional";
  company: string | null;
  municipio: string | null;
  service_interest: string | null;
  budget_range: string | null;
  source: string | null;
  message: string | null;
  gdpr_consent: boolean;
  status: "new" | "spam";
  is_read: boolean;
  spam_reason: string | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

const RANGOS_OK = new Set([
  "Menos de 2.000 €",
  "2.000 – 5.000 €",
  "5.000 – 10.000 €",
  "10.000 – 20.000 €",
  "Más de 20.000 €",
  "Todavía no lo sé",
]);

const ERROR_GUARDADO =
  "No hemos podido registrar el mensaje. Llámanos al 678 495 046 y lo resolvemos.";

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Petición no válida." }, { status: 400 });
  }

  const lead: Lead = {
    name: String(body.name ?? "").trim().slice(0, 120),
    email: String(body.email ?? "").trim().toLowerCase().slice(0, 160),
    phone: String(body.phone ?? "").trim().slice(0, 40),
    contact_type: body.contact_type === "professional" ? "professional" : "particular",
    company: String(body.company ?? "").trim().slice(0, 160),
    municipio: String(body.municipio ?? "").trim().slice(0, 120),
    service_interest: String(body.service_interest ?? "").trim().slice(0, 120),
    budget_range: RANGOS_OK.has(String(body.budget_range ?? "").trim())
      ? String(body.budget_range).trim()
      : "",
    referral_source: String(body.referral_source ?? "").trim().slice(0, 120),
    message: String(body.message ?? "").trim().slice(0, 4000),
  };

  // 1 · Validación
  if (!lead.name || !lead.phone || !EMAIL_RE.test(lead.email)) {
    return NextResponse.json(
      { ok: false, error: "Faltan datos: nombre, teléfono y un email válido." },
      { status: 400 }
    );
  }
  if (!body.gdpr_consent) {
    return NextResponse.json(
      { ok: false, error: "Hay que aceptar la política de privacidad." },
      { status: 400 }
    );
  }
  if (lead.contact_type === "professional" && !lead.company) {
    return NextResponse.json(
      { ok: false, error: "Indica el nombre de la empresa." },
      { status: 400 }
    );
  }

  // 2 · Anti-spam silencioso: el bot cree que ha funcionado.
  const { spam, motivo } = detectarSpam({
    name: lead.name,
    email: lead.email,
    message: lead.message,
    website: String(body.website ?? ""),
    form_started_at: Number(body.form_started_at ?? 0),
  });

  // 3 · Dónde se guarda
  const supabase = getSupabaseAdmin();
  const local = !supabase && localDbActivo();

  if (!supabase && !local) {
    // Producción sin Supabase: no fingimos que se ha guardado.
    console.error("[contact] Supabase no configurado: el lead no se ha guardado.");
    return NextResponse.json(
      {
        ok: false,
        error:
          "Ahora mismo no podemos registrar el mensaje. Llámanos al 678 495 046 y lo resolvemos.",
      },
      { status: 503 }
    );
  }

  const fila: FilaLead = {
    name: lead.name,
    email: lead.email,
    phone: lead.phone,
    contact_type: lead.contact_type,
    company: lead.company || null,
    municipio: lead.municipio || null,
    service_interest: lead.service_interest || null,
    budget_range: lead.budget_range || null,
    source: lead.referral_source || null,
    message: lead.message || null,
    gdpr_consent: true,
    status: spam ? "spam" : "new",
    is_read: spam,
    spam_reason: spam ? (motivo ?? null) : null,
  };

  let id: string | null = null;

  if (supabase) {
    const { data, error } = await supabase
      .from("contact_submissions")
      .insert(fila)
      .select("id")
      .single();
    if (error) {
      console.error("[contact] error al insertar:", error.message);
      // Al bot no le damos pistas: si era spam, respuesta normal.
      if (spam) return NextResponse.json({ ok: true, mail: false }, { status: 201 });
      return NextResponse.json({ ok: false, error: ERROR_GUARDADO }, { status: 503 });
    }
    id = (data?.id as string) ?? null;
  } else {
    try {
      id = insertarLocal("contact_submissions", fila).id;
      console.warn("[contact] guardado en .data/contact_submissions.jsonl (modo local).");
    } catch (error) {
      console.error("[contact] no se pudo escribir en .data:", error);
      if (spam) return NextResponse.json({ ok: true, mail: false }, { status: 201 });
      return NextResponse.json({ ok: false, error: ERROR_GUARDADO }, { status: 503 });
    }
  }

  // 4 · Spam: fila marcada para auditar, ni correo ni evento.
  if (spam) {
    return NextResponse.json({ ok: true, mail: false }, { status: 201 });
  }

  // 5 · Par de correos (si no hay SMTP, la fila ya está guardada)
  const mail = smtpConfigurado() ? await enviarParDeCorreos(lead) : false;

  return NextResponse.json({ ok: true, id, mail }, { status: 201 });
}
