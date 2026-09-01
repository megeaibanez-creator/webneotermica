import fs from "node:fs";
import path from "node:path";
import { NextResponse } from "next/server";
import { exigirAdmin } from "@/lib/admin";
import { type Project, normalizarProyecto } from "@/lib/crm";
import { actualizarLocal, leerLocal, localDbActivo } from "@/lib/db/local";
import { getServicio } from "@/lib/servicios";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function mimeDe(src: string): string {
  if (src.endsWith(".png")) return "image/png";
  if (src.endsWith(".webp")) return "image/webp";
  return "image/jpeg";
}

export async function POST(request: Request) {
  const corte = await exigirAdmin();
  if (corte) return corte;

  const key = process.env.OPENAI_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "Falta OPENAI_API_KEY." }, { status: 503 });
  }

  const body = (await request.json()) as { id?: string };
  if (!body.id) return NextResponse.json({ error: "Falta la obra." }, { status: 400 });

  let obra: Project | null = null;
  const supabase = getSupabaseAdmin();
  if (supabase) {
    const { data } = await supabase.from("projects").select("*").eq("id", body.id).maybeSingle();
    obra = data ? normalizarProyecto(data as Project) : null;
  } else if (localDbActivo()) {
    const fila = leerLocal<Project>("projects").find((p) => p.id === body.id);
    obra = fila ? normalizarProyecto(fila) : null;
  }
  if (!obra) return NextResponse.json({ error: "Esa obra no existe." }, { status: 404 });

  const oficio = obra.service ? (getServicio(obra.service)?.nombre ?? obra.service) : "climatización";
  const datos = [
    `Tipo de instalación: ${oficio}`,
    obra.m2 ? `Superficie: ${obra.m2} m²` : null,
    obra.municipio ? `Municipio: ${obra.municipio}` : null,
    obra.notes ? `Notas de oficio (sin datos personales): ${obra.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const imagenes = obra.photos.slice(0, 4).flatMap((foto) => {
    const abs = path.join(process.cwd(), "public", foto.src.replace(/^\//, ""));
    if (!fs.existsSync(abs)) return [];
    const b64 = fs.readFileSync(abs).toString("base64");
    return [
      {
        type: "image_url" as const,
        image_url: { url: `data:${mimeDe(foto.src)};base64,${b64}` },
      },
    ];
  });

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "Eres redactor de Neotérmica (climatización en Murcia). Escribes fichas de obra publicables. " +
            "Nunca menciones nombres de cliente, teléfonos, emails, precios, importes, calles ni datos personales. " +
            "Tuteas. Español de España. Tono de oficio, no de catálogo. " +
            "Responde SOLO JSON: public_title (hasta 70 caracteres), public_excerpt (1-2 frases), public_body (3-5 párrafos en HTML simple: <p> y <ul><li>).",
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text:
                `Redacta la ficha pública de esta instalación.\n${datos}\n` +
                (imagenes.length
                  ? "Las fotos van por fases (antes / durante / después). Descríbelas sin inventar marcas."
                  : "No hay fotos: no inventes detalles visuales."),
            },
            ...imagenes,
          ],
        },
      ],
    }),
  });

  const raw = await res.text();
  if (!res.ok) {
    return NextResponse.json(
      { error: `OpenAI ${res.status}` },
      { status: 502 }
    );
  }

  let parsed: {
    public_title?: string;
    public_excerpt?: string;
    public_body?: string;
  };
  try {
    const data = JSON.parse(raw) as { choices?: { message?: { content?: string } }[] };
    parsed = JSON.parse(data.choices?.[0]?.message?.content ?? "{}") as typeof parsed;
  } catch {
    return NextResponse.json({ error: "La IA no devolvió un JSON válido." }, { status: 502 });
  }

  const public_title = parsed.public_title?.trim() || obra.title;
  const public_excerpt = parsed.public_excerpt?.trim() || null;
  const public_body = parsed.public_body?.trim() || null;
  const cambios = { public_title, public_excerpt, public_body };

  if (supabase) {
    const { error } = await supabase.from("projects").update(cambios).eq("id", obra.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else if (localDbActivo()) {
    actualizarLocal("projects", obra.id, cambios);
  }

  return NextResponse.json({ ok: true, ...cambios });
}
