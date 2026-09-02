# Neotérmica — `webneotermica`

Web de climatización en Murcia. **Encargo.** Viva en Next: [www.neotermica.com](https://www.neotermica.com) (2 sep). Apex y `webneotermica.vercel.app` hacen 308 → www. WordPress queda en Plesk, **sin** el dominio.

GitHub: [megeaibanez-creator/webneotermica](https://github.com/megeaibanez-creator/webneotermica) (cuenta del **cliente**, no Eskala). Vercel: team **NEOTERMICA** · `webneotermica`.

Stack: Next **16.3.3**, React **19.2.8**, Tailwind 3.4, `proxy.ts`. Supabase `roxsbwhqhqvajvfszeue` (org **Neotermica**, cuenta del cliente). **Nunca MCP.** Todo por `.env.local`.

Ficha del taller: `MAPA-PROYECTOS.md` · `RAID-CUENTAS-Y-STACK.md`. SEO de la matriz: `W - NEOTERMICA/ESTRATEGIA-SEO.md`. Editorial del blog: `W - NEOTERMICA/EDITORIAL-BLOG.md` (vive en la **W**, no en el repo).

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
| `/blog` + `/blog/{slug}` | Tabla `blog_articles`. Texto: `redact:blog`. Portada: URL de Storage, no un JPG en el repo. Molde: comercios. |
| `/contacto` | Formulario (`#formulario`) + mapa. El form **no** va en la home. |
| `/aviso-legal`, `/politica-de-privacidad`, `/politica-de-cookies`, `/accesibilidad` | Legal. |
| `/administrator` | Taller (rol **admin**): panel, blog, clientes, contactos, proyectos, **agenda**, presupuestos, facturación, **equipo**, chat. Auth: `megeaibanez@gmail.com`. |
| `/administrator/agenda` | Calendario mensual de actuaciones. Filtro por técnico (color por persona). Alta/edición en hoja lateral. `?obra=ID` abre el editor con la obra ya elegida. |
| `/administrator/equipo` | Alta y edición de usuarios (admin / admin+técnico / técnico). Crea el usuario en Auth + su fila en `profiles`. |
| `/administrator/mi-agenda` | Solo para el **admin+técnico**: sus actuaciones asignadas, dentro del panel. |
| `/tecnico` | Área del **técnico puro**: solo su agenda (actuaciones asignadas), datos del cliente y poco más. Mobile-first (PWA de obra). No ve el resto del CRM. |

Chat del visitante: **Nora** («Nora, tu asistente virtual de NEOTERMICA»). Avatar `public/images/NORA_chatbot.png`. ≠ Nora de Eskala. Prompt en `src/lib/chatbot/prompt.ts`. Modelo `gpt-5.6-terra`.

---

## CRM: embudo contacto → cliente → obra → actuación

Cuatro entidades distintas **a propósito**. No hay cascada automática: cada salto es una decisión del taller, para que "Clientes" y "Proyectos" no se llenen de curiosos ni spam.

```
/contacto (web)        Contactos          Clientes            Proyectos            Agenda
────────────────   ───────────────   ───────────────   ─────────────────   ─────────────────
rellena el form →  Lead (consulta) → Cliente real    → Obra (project)     → Actuaciones
                   [Pasar a cliente]  [Nueva obra]      [+ Nueva actuación]  (fechas, técnicos)
```

1. **Lead** (`contact_submissions`): cualquiera que rellena `/contacto`. Solo una consulta. Se gestiona en `/administrator/contactos` y **no se borra**.
2. **Pasar a cliente**: botón en la ficha del lead (`pasarACliente`, `src/app/administrator/contactos/page.tsx` → `POST /api/admin/crm` con `from_lead_id`). Copia nombre/mail/tel/municipio y enlaza `lead_id ↔ client_id`. Marca el lead como `replied`.
3. **Obra** (`projects`): se crea dentro de la ficha del cliente.
4. **Actuación** (`actuaciones`): fase de una obra. Desde la ficha de la obra, botón **"+ Nueva actuación"** → `/administrator/agenda?obra=ID`. También desde la agenda directamente.

Presupuestos y facturas cuelgan igual del cliente/obra (`quotes`, `invoices`).

## Actuaciones y agenda

Una obra se parte en **fases = actuaciones** (instalar un split = 1; una obra mayor = instalación previa + montaje + varios días). Cada actuación lleva:

- **Tiempos flexibles**: `starts_at` / `ends_at` (timestamp) y `dia_completo`. Sirve para una cita corta o para varios días.
- **Tipo** y **estado** (pendiente → en curso → hecha), **ubicación**, **notas**.
- **Responsables**: N técnicos vía `actuacion_responsables`. Cada técnico tiene un **color** para el calendario.

La **agenda** (`/administrator/agenda`, `src/components/admin/Agenda.tsx`) es un calendario mensual con filtro por técnico. Tipos, estados, colores y utilidades de fecha en `src/lib/agenda.ts`.

## Roles y accesos

Multiusuario desde el arranque. El rol vive en `profiles` (`rol` + `es_tecnico`), no en una lista de emails.

| Perfil | `rol` / `es_tecnico` | Qué ve |
|---|---|---|
| **Admin** | `admin` | Todo `/administrator`. |
| **Admin + técnico** (José Carlos, socio) | `admin` + `es_tecnico=true` | Todo `/administrator` **más** el grupo "Técnico" (Mi agenda) en el menú. |
| **Técnico puro** (futuros) | `tecnico` | Solo `/tecnico`: sus actuaciones, datos del cliente y poco más. No entra al CRM. |

- Portero por rol: `src/lib/staff.ts` (`getStaffActual`) + `src/lib/admin.ts` (`exigirAdmin`, `exigirStaff`). Rol actual del navegador: `GET /api/staff/me`.
- El login (`/administrator/login`, callback de Google y guard del panel) **redirige por rol**: técnico → `/tecnico`, admin → `/administrator`.
- El menú lateral (`AdminChrome.tsx`) enseña el grupo "Técnico" solo si `es_tecnico`.

### API

| Endpoint | Quién | Qué |
|---|---|---|
| `GET/POST/PATCH /api/admin/agenda` | admin | CRUD de actuaciones + proyectos, clientes y técnicos asignables. |
| `GET/PATCH /api/tecnico/agenda` | técnico | Solo sus actuaciones; edita **estado** y **notas**, nada más. |
| `GET/POST/PATCH /api/admin/equipo` | admin | Gestión de `profiles` (alta en Auth + fila). |
| `GET /api/staff/me` | sesión | Rol actual (`admin`/`tecnico`, `es_tecnico`). |

RLS: un técnico con su token **no** lee clientes/obras/presupuestos/facturas por la API pública; el admin escribe con service role (salta RLS). Migraciones `0007` (agenda + RLS) y `0008` (`es_tecnico`).

## Móvil / PWA

La PWA se usa mucho en móvil (obra). La hoja de edición (`AdminHoja.tsx`) es **bottom-sheet nativo en el teléfono** (sube desde abajo, tirador, esquinas redondeadas, respeta `safe-area` del iPhone en pie y contenido) y **lateral derecha en escritorio**. Animaciones `admin-sube` / `admin-desliza` en `globals.css`. La vista del técnico (`MiAgenda.tsx`) es mobile-first, agrupada por día.

---

## Scripts

| Comando | Uso |
|---|---|
| `npm run dev` / `build` / `start` | Next |
| `npm run redact:blog` | Agente redactor (`gpt-5.6-terra` + web_search). `--all` / `--reescribir` / un trozo de slug. **No** pases `--force` por npm: se lo come. |
| `npm run generate:blog-covers` | Portada **después** del texto. Sube a Storage. Sin `reescrito` se salta. No deja JPG en el repo. |
| `npm run import:blog` | Traer posts (migración WP). |
| `npm run ingest:chatbot-kb` | Embeddings del RAG. |
| `npm run review:chatbot-messages` | Revisor (10/5/0). Si sale 5 o 0, **arreglar Nora en el mismo turno**. Windows: `npx tsx scripts/review-chatbot-messages.ts`. |

Fotos de oficio (one-off): `node scripts/generate-servicio-fotos.mjs`.

---

## Reglas que no se improvisan

- **Sin calle ni NIF** inventados. NAP = teléfono + mail + Murcia (`src/lib/site.ts`).
- **Sin landings** `/servicios/{pueblo}/…`. Radio 50 km en copy, mapa y GBP.
- Calculadora: los % de `src/components/home/Calculadora.tsx` son **provisionales**. Preguntar a José Carlos (lista en RAID, 31 ago).
- Leaflet en Next 16: el mapa se importa en un cliente; `useEffect` con `cancelado` + `map.remove()`. No `next/dynamic` + `ssr: false`.
- No borrar chat de visitante. Solo `tester_*` / IDs que liste Narciso.
- El formulario **no** admite fotos. El chat no las pide. **Más adelante** (Narciso, 31 ago): adjunto en el lead si se encarga. Hoy José Carlos las ve en la visita.
- Revisor 10/5/0: si hay mejorable o incorrecta, se arregla Nora **en el mismo turno** (prompt / fallback / RAG). El informe solo no cierra.

---

## Esquema (Supabase del cliente)

Ref `roxsbwhqhqvajvfszeue`. Migraciones `0001` → `0008` aplicadas. Auth multiusuario por **rol** (`profiles`), no por lista de emails: hoy José Carlos `megeaibanez@gmail.com` (admin+técnico); los futuros técnicos se dan de alta en `/administrator/equipo`. El visitante no se registra. `anon` no lee leads ni chat; escribe la API con service role. Sin `.env.local` de BD, en dev las mismas columnas van a `.data/<tabla>.jsonl`.

| Tabla | Qué guarda | Admin |
|---|---|---|
| `contact_submissions` | Lead del form: nombre, mail, tel, particular/pro, empresa, municipio, oficio, rango de presupuesto, origen, mensaje, GDPR, estado, spam | `/administrator/contactos` · Pasar a cliente |
| `clients` | Quien contrata (puede venir de un lead) | `/administrator/clientes` |
| `projects` | Obra: título, oficio, municipio, estado, notas. Extra 0004: m², importe, fotos, publicable, textos de ficha | `/administrator/proyectos` · el formulario **aún no** pide m²/fotos/ficha |
| `quotes` | Oferta del taller (`PRE-año-001`), no el rango del form | `/administrator/presupuestos` |
| `invoices` | Factura (`FAC-año-001`) | `/administrator/facturacion` |
| `profiles` | Usuario del taller: `nombre`, `rol` (`admin`/`tecnico`), `es_tecnico`, `color`, `telefono`, `activo` | `/administrator/equipo` |
| `actuaciones` | Fase de una obra: título, tipo, estado, `starts_at`/`ends_at`, `dia_completo`, ubicación, notas | `/administrator/agenda` · técnico ve las suyas en `/tecnico` |
| `actuacion_responsables` | Qué técnicos van a cada actuación (N a N) | se asigna en el editor de la actuación |
| `chat_threads` / `chat_messages` | Hilo + turnos. `rag_gap` en el mensaje | `/administrator/chatbot` · nota 10/5/0 la pone el revisor |
| `chat_reviews` | Esa nota | misma pantalla |
| `chatbot_kb` | Embeddings (landings + blog). Postgres + `vector` | no hay tabla en el admin |
| `blog_articles` | Posts públicos + cola. Portadas en Storage `blog/covers` | `/administrator/blog` |

**No va en Git:** portadas del blog (viven en Storage `blog/covers`). Fotos de obras: `public/uploads/` (local).

Huecos: `chatbot_kb` no funciona en `.data`. El panel de chat ya es el molde Andrea: Respuestas + Conversaciones; califica el revisor, no el admin. Fotos en el form de contacto: **más adelante**, no ahora.

---

## Infra (ya está)

| | |
|---|---|
| **GitHub** | **megeaibanez-creator** / `webneotermica` |
| **Vercel** | Team NEOTERMICA (Hobby) · [www.neotermica.com](https://www.neotermica.com) |
| **Supabase** | `roxsbwhqhqvajvfszeue` · org Neotermica · **nunca MCP** · `.env.local` |
