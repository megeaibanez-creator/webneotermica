-- =====================================================================
-- Neotérmica · migración inicial
-- =====================================================================
-- Cómo se aplica (cuando exista el proyecto Supabase):
--
--   supabase link --project-ref <ref>
--   supabase db push
--
-- O, si se prefiere el SQL Editor del dashboard, pegar este fichero
-- entero de una vez. Es idempotente: se puede volver a lanzar.
--
-- Auth = 1 solo admin, creado a mano desde Authentication > Users.
-- El visitante NO se registra: esto es una vitrina.
-- =====================================================================

create extension if not exists "pgcrypto";
create extension if not exists "vector";


-- ---------------------------------------------------------------------
-- 1 · Leads del formulario de /contacto
-- ---------------------------------------------------------------------
create table if not exists public.contact_submissions (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),

  name             text not null,
  email            text not null,
  phone            text not null,

  contact_type     text not null default 'particular'
                     check (contact_type in ('particular', 'professional')),
  company          text,                       -- obligatorio si contact_type = 'professional'
  municipio        text,
  service_interest text,                       -- slug de una de las 8 landings
  budget_range     text,                       -- rango que marca el visitante
  source           text,                       -- Google, conocido, otro
  message          text,

  gdpr_consent     boolean not null default false,

  status           text not null default 'new'
                     check (status in ('new', 'read', 'replied', 'archived', 'spam')),
  is_read          boolean not null default false,
  spam_reason      text                        -- motivo de la heurística silenciosa
);

-- Coherencia: si es empresa, la razón social no puede ir vacía.
alter table public.contact_submissions
  drop constraint if exists contact_submissions_company_required;
alter table public.contact_submissions
  add constraint contact_submissions_company_required
  check (contact_type <> 'professional' or coalesce(company, '') <> '');

create index if not exists contact_submissions_created_at_idx
  on public.contact_submissions (created_at desc);
create index if not exists contact_submissions_status_idx
  on public.contact_submissions (status);


-- ---------------------------------------------------------------------
-- 2 · Chat del asistente — hilos y mensajes
-- ---------------------------------------------------------------------
create table if not exists public.chat_threads (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  session_id    text not null,
  visitor_label text
);

create index if not exists chat_threads_session_idx
  on public.chat_threads (session_id);
create index if not exists chat_threads_created_at_idx
  on public.chat_threads (created_at desc);

create table if not exists public.chat_messages (
  id         uuid primary key default gen_random_uuid(),
  thread_id  uuid not null references public.chat_threads (id) on delete cascade,
  created_at timestamptz not null default now(),
  role       text not null check (role in ('user', 'assistant')),
  content    text not null,
  rag_gap    jsonb                            -- qué se buscó y qué encontró el RAG
);

create index if not exists chat_messages_thread_idx
  on public.chat_messages (thread_id, created_at);
create index if not exists chat_messages_role_idx
  on public.chat_messages (role);


-- ---------------------------------------------------------------------
-- 3 · Base de conocimiento del RAG (8 landings + posts del blog)
-- ---------------------------------------------------------------------
create table if not exists public.chatbot_kb (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  source     text not null,                   -- 'servicio' | 'blog' | 'ficha'
  slug       text not null,
  content    text not null,
  embedding  vector(1536)                     -- text-embedding-3-small
);

create unique index if not exists chatbot_kb_source_slug_idx
  on public.chatbot_kb (source, slug);

-- Índice vectorial. ivfflat necesita filas para entrenar las listas, así que
-- conviene (re)crearlo DESPUÉS del primer `npm run ingest:chatbot-kb`.
create index if not exists chatbot_kb_embedding_idx
  on public.chatbot_kb using ivfflat (embedding vector_cosine_ops) with (lists = 100);


-- ---------------------------------------------------------------------
-- 4 · Auditor del chatbot (respuestas únicas: 10 / 5 / 0)
-- ---------------------------------------------------------------------
create table if not exists public.chat_reviews (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  message_id uuid not null references public.chat_messages (id) on delete cascade,
  score      int not null check (score in (0, 5, 10)),
  notes      text
);

create unique index if not exists chat_reviews_message_idx
  on public.chat_reviews (message_id);


-- ---------------------------------------------------------------------
-- 5 · Búsqueda vectorial que llama src/lib/chatbot/rag.ts
-- ---------------------------------------------------------------------
create or replace function public.match_chatbot_kb (
  query_embedding vector(1536),
  match_threshold float,
  match_count int
)
returns table (
  source     text,
  slug       text,
  content    text,
  similarity float
)
language sql
stable
as $$
  select
    kb.source,
    kb.slug,
    kb.content,
    1 - (kb.embedding <=> query_embedding) as similarity
  from public.chatbot_kb kb
  where kb.embedding is not null
    and 1 - (kb.embedding <=> query_embedding) > match_threshold
  order by kb.embedding <=> query_embedding
  limit match_count;
$$;


-- ---------------------------------------------------------------------
-- 6 · RLS
-- ---------------------------------------------------------------------
-- Regla: `anon` no lee NADA. Las escrituras van por la API con service role,
-- que se salta RLS. El admin autenticado lee y gestiona.
-- ---------------------------------------------------------------------
alter table public.contact_submissions enable row level security;
alter table public.chat_threads        enable row level security;
alter table public.chat_messages       enable row level security;
alter table public.chatbot_kb          enable row level security;
alter table public.chat_reviews        enable row level security;

drop policy if exists "admin lee leads"      on public.contact_submissions;
drop policy if exists "admin edita leads"    on public.contact_submissions;
drop policy if exists "admin lee hilos"      on public.chat_threads;
drop policy if exists "admin lee mensajes"   on public.chat_messages;
drop policy if exists "admin lee kb"         on public.chatbot_kb;
drop policy if exists "admin gestiona notas" on public.chat_reviews;

create policy "admin lee leads" on public.contact_submissions
  for select to authenticated using (true);

create policy "admin edita leads" on public.contact_submissions
  for update to authenticated using (true) with check (true);

create policy "admin lee hilos" on public.chat_threads
  for select to authenticated using (true);

create policy "admin lee mensajes" on public.chat_messages
  for select to authenticated using (true);

create policy "admin lee kb" on public.chatbot_kb
  for select to authenticated using (true);

create policy "admin gestiona notas" on public.chat_reviews
  for all to authenticated using (true) with check (true);

-- Nota deliberada: NO hay policy de DELETE sobre chat_threads ni chat_messages.
-- El chat de un visitante no se borra. La limpieza de pruebas
-- (tester_* / stress_* / check_*) se hace con service role desde un script.
