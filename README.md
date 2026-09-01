# Neotérmica — `webneotermica`

Web nueva de climatización en Murcia. **Encargo.** La viva sigue siendo WordPress ([neotermica.com](https://neotermica.com)). GitHub: [megeaibanez-creator/webneotermica](https://github.com/megeaibanez-creator/webneotermica).

Stack: Next **16.3.3**, React **19.2.8**, Tailwind 3.4, `proxy.ts`. Destino: Supabase (hoy leads y chat en `.data/*.jsonl` si no hay `.env.local` de BD).

Ficha del taller: `MAPA-PROYECTOS.md` · `RAID-CUENTAS-Y-STACK.md`. SEO de la matriz: `W - NEOTERMICA/ESTRATEGIA-SEO.md`. Editorial del blog: `EDITORIAL-BLOG.md` (cuando haya Git, esa guía vive en la **W**, no en el repo).

---

## Arranque

Node **≥ 20.9**.

```bash
cp .env.example .env.local   # rellena; no subas .env.local
npm install
npm run dev                  # http://localhost:3000
```

En Windows, si `fetch` a OpenAI o Supabase falla por TLS (proxy Acttax): la misma llamada con `NODE_TLS_REJECT_UNAUTHORIZED=0`. No pases SQL a Narciso.

---

## Rutas

| Ruta | Qué es |
|---|---|
| `/` | Home. Calculadora = horquilla (tabla + fórmula, no un LLM). % provisionales. |
| `/servicios` + `/servicios/{oficio}` | Hub + 8 landings (H2 pregunta, schema Service/FAQ). **Sin** pueblo en la URL. Posts del oficio = carrusel de la home. |
| `/estancias` | Recorrido 3D. |
| `/blog` + `/blog/{slug}` | 21 posts en `content/blog/`. Texto: agente `redact:blog`. Portada: `cover:` + `public/images/blog/`. Molde: comercios. |
| `/contacto` | Formulario (`#formulario`) + mapa. El form **no** va en la home. |
| `/aviso-legal`, `/politica-de-privacidad`, `/politica-de-cookies`, `/accesibilidad` | Legal. |
| `/administrator` | Taller: blog, contactos, CRM, chat (Respuestas + Conversaciones; nota del revisor). |

Chat del visitante: **Neo** («Neo, tu asistente virtual de climatización»). Avatar `public/images/neo_chatbot.png`. Prompt en `src/lib/chatbot/prompt.ts`. Modelo `gpt-5.6-terra`.

---

## Scripts

| Comando | Uso |
|---|---|
| `npm run dev` / `build` / `start` | Next |
| `npm run redact:blog` | Agente redactor (`gpt-5.6-terra` + web_search). `--all` / `--reescribir` / un trozo de slug. **No** pases `--force` por npm: se lo come. |
| `npm run generate:blog-covers` | Portada **después** del texto. Lee el artículo → `gpt-image-2`. Sin `reescrito:` se salta. |
| `npm run import:blog` | Traer posts (migración WP). |
| `npm run ingest:chatbot-kb` | Embeddings del RAG. |
| `npm run review:chatbot-messages` | Revisor (10/5/0). Local: `.data`. Windows: `npx tsx scripts/review-chatbot-messages.ts`. |

Fotos de oficio (one-off): `node scripts/generate-servicio-fotos.mjs`.

---

## Reglas que no se improvisan

- **Sin calle ni NIF** inventados. NAP = teléfono + mail + Murcia (`src/lib/site.ts`).
- **Sin landings** `/servicios/{pueblo}/…`. Radio 50 km en copy, mapa y GBP.
- Calculadora: los % de `src/components/home/Calculadora.tsx` son **provisionales**. Preguntar a José Carlos (lista en RAID, 31 ago).
- Leaflet en Next 16: el mapa se importa en un cliente; `useEffect` con `cancelado` + `map.remove()`. No `next/dynamic` + `ssr: false`.
- No borrar chat de visitante. Solo `tester_*` / IDs que liste Narciso.
- El formulario **no** admite fotos. El chat no las pide. **Más adelante** (Narciso, 31 ago): adjunto en el lead cuando haya Supabase, si se encarga. Hoy José Carlos las ve en la visita.

---

## Esquema (aún no hay proyecto Supabase)

El SQL está escrito. Hoy, en dev, las mismas columnas van a `.data/<tabla>.jsonl`. El día que exista el proyecto: `0001` → `0004` (las aplico yo; no pegas SQL). Auth = **un** admin a mano. El visitante no se registra. `anon` no lee leads ni chat; escribe la API con service role.

| Tabla | Qué guarda | Admin |
|---|---|---|
| `contact_submissions` | Lead del form: nombre, mail, tel, particular/pro, empresa, municipio, oficio, rango de presupuesto, origen, mensaje, GDPR, estado, spam | `/administrator/contactos` · Pasar a cliente |
| `clients` | Quien contrata (puede venir de un lead) | `/administrator/clientes` |
| `projects` | Obra: título, oficio, municipio, estado, notas. Extra 0004: m², importe, fotos, publicable, textos de ficha | `/administrator/proyectos` · el formulario **aún no** pide m²/fotos/ficha |
| `quotes` | Oferta del taller (`PRE-año-001`), no el rango del form | `/administrator/presupuestos` |
| `invoices` | Factura (`FAC-año-001`) | `/administrator/facturacion` |
| `chat_threads` / `chat_messages` | Hilo + turnos. `rag_gap` en el mensaje | `/administrator/chatbot` · nota 10/5/0 la pone el revisor |
| `chat_reviews` | Esa nota | misma pantalla |
| `chatbot_kb` | Embeddings (landings + blog). Hace falta Postgres + `vector` | no hay tabla en el admin |

**No va en Supabase:** las fotos de obras (`public/uploads/`). Blog: texto en `blog_articles`, portadas en Storage (bucket `blog/covers`). Copia local en `public/images/blog/` y `content/blog/` para el redactor.

Huecos: `/proyectos` pública no está; `chatbot_kb` no funciona en `.data`. El panel de chat ya es el molde Andrea: Respuestas + Conversaciones; califica el revisor, no el admin. Fotos en el form de contacto: **más adelante**, no ahora.

---

## Pendiente de infra

GitHub, Vercel y proyecto Supabase: **por decidir**. El esquema está en `supabase/migrations/`.
