import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { insertarLocal, localDbActivo } from "@/lib/db/local";
import { detectarSpam } from "@/lib/spam";
import { enviarParEmpleo, smtpConfigurado, type Candidato } from "@/lib/email";
import {
  DISPONIBILIDADES,
  EDADES,
  EXPERIENCIAS,
  FORMACIONES,
  PUESTOS,
  enLista,
} from "@/lib/empleo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Body = Partial<Candidato> & {
  gdpr_consent?: boolean;
  website?: string;
  fax?: string;
  form_started_at?: number;
};

type Fila = {
  name: string;
  email: string;
  phone: string;
  municipio: string | null;
  puesto: string | null;
  formacion: string | null;
  experiencia: string | null;
  edad: string | null;
  carnet: string | null;
  disponibilidad: string | null;
  message: string | null;
  gdpr_consent: boolean;
  status: "new" | "spam";
  is_read: boolean;
  spam_reason: string | null;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ERROR_GUARDADO =
  "No hemos podido registrar la solicitud. Llámanos al 678 495 046.";

export async function POST(request: Request) {
  let body: Body;
  try {
    body = (await request.json()) as Body;
  } catch {
    return NextResponse.json({ ok: false, error: "Petición no válida." }, { status: 400 });
  }

  const candidato: Candidato = {
    name: String(body.name ?? "").trim().slice(0, 120),
    email: String(body.email ?? "").trim().toLowerCase().slice(0, 160),
    phone: String(body.phone ?? "").trim().slice(0, 40),
    municipio: String(body.municipio ?? "").trim().slice(0, 120),
    puesto: enLista(String(body.puesto ?? "").trim(), PUESTOS) ? String(body.puesto).trim() : "",
    formacion: enLista(String(body.formacion ?? "").trim(), FORMACIONES)
      ? String(body.formacion).trim()
      : "",
    experiencia: enLista(String(body.experiencia ?? "").trim(), EXPERIENCIAS)
      ? String(body.experiencia).trim()
      : "",
    edad: enLista(String(body.edad ?? "").trim(), EDADES) ? String(body.edad).trim() : "",
    carnet: body.carnet === "Sí" || body.carnet === "No" ? String(body.carnet) : "",
    disponibilidad: enLista(String(body.disponibilidad ?? "").trim(), DISPONIBILIDADES)
      ? String(body.disponibilidad).trim()
      : "",
    message: String(body.message ?? "").trim().slice(0, 4000),
  };

  if (!candidato.name || !candidato.phone || !EMAIL_RE.test(candidato.email) || !candidato.municipio) {
    return NextResponse.json(
      { ok: false, error: "Faltan datos: nombre, teléfono, email y municipio." },
      { status: 400 }
    );
  }
  if (!candidato.puesto || !candidato.formacion || !candidato.experiencia || !candidato.edad) {
    return NextResponse.json(
      { ok: false, error: "Indica puesto, formación, experiencia y edad." },
      { status: 400 }
    );
  }
  if (!body.gdpr_consent) {
    return NextResponse.json(
      { ok: false, error: "Hay que aceptar la política de privacidad." },
      { status: 400 }
    );
  }

  const { spam, motivo } = detectarSpam({
    name: candidato.name,
    email: candidato.email,
    message: candidato.message || candidato.formacion,
    website: String(body.website ?? ""),
    fax: String(body.fax ?? ""),
    form_started_at: Number(body.form_started_at ?? 0),
  });

  const supabase = getSupabaseAdmin();
  const local = !supabase && localDbActivo();

  if (!supabase && !local) {
    console.error("[empleo] Supabase no configurado: la candidatura no se ha guardado.");
    return NextResponse.json(
      {
        ok: false,
        error:
          "Ahora mismo no podemos registrar la solicitud. Llámanos al 678 495 046.",
      },
      { status: 503 }
    );
  }

  const fila: Fila = {
    name: candidato.name,
    email: candidato.email,
    phone: candidato.phone,
    municipio: candidato.municipio || null,
    puesto: candidato.puesto || null,
    formacion: candidato.formacion || null,
    experiencia: candidato.experiencia || null,
    edad: candidato.edad || null,
    carnet: candidato.carnet || null,
    disponibilidad: candidato.disponibilidad || null,
    message: candidato.message || null,
    gdpr_consent: true,
    status: spam ? "spam" : "new",
    is_read: spam,
    spam_reason: spam ? (motivo ?? null) : null,
  };

  let id: string | null = null;

  if (supabase) {
    const { data, error } = await supabase
      .from("job_applications")
      .insert(fila)
      .select("id")
      .single();
    if (error) {
      console.error("[empleo] error al insertar:", error.message);
      if (spam) return NextResponse.json({ ok: true, mail: false }, { status: 201 });
      return NextResponse.json({ ok: false, error: ERROR_GUARDADO }, { status: 503 });
    }
    id = (data?.id as string) ?? null;
  } else {
    try {
      id = insertarLocal("job_applications", fila).id;
    } catch (error) {
      console.error("[empleo] no se pudo escribir en .data:", error);
      if (spam) return NextResponse.json({ ok: true, mail: false }, { status: 201 });
      return NextResponse.json({ ok: false, error: ERROR_GUARDADO }, { status: 503 });
    }
  }

  if (spam) {
    return NextResponse.json({ ok: true, mail: false }, { status: 201 });
  }

  const mail = smtpConfigurado() ? await enviarParEmpleo(candidato) : false;
  return NextResponse.json({ ok: true, id, mail }, { status: 201 });
}
