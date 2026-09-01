-- =====================================================================
-- Neotérmica · taller: clientes, obras, presupuestos, facturas
-- =====================================================================
-- Lead (contact_submissions) ──opcional──► client
-- client 1—* projects
-- client 1—* quotes ; project 0..1—* quotes
-- client 1—* invoices ; project/quote 0..1—* invoices
--
-- El rango del formulario web no es un presupuesto. La oferta vive aquí.
-- =====================================================================

create table if not exists public.clients (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  name          text not null,
  email         text,
  phone         text,
  contact_type  text not null default 'particular'
                  check (contact_type in ('particular', 'professional')),
  company       text,
  municipio     text,
  notes         text,
  lead_id       uuid unique references public.contact_submissions (id) on delete set null
);

create index if not exists clients_created_at_idx on public.clients (created_at desc);
create index if not exists clients_name_idx on public.clients (name);

create table if not exists public.projects (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  client_id   uuid not null references public.clients (id) on delete restrict,
  title       text not null,
  service     text,
  municipio   text,
  status      text not null default 'previsto'
                check (status in ('previsto', 'en_obra', 'entregado', 'cancelado')),
  notes       text
);

create index if not exists projects_client_idx on public.projects (client_id);
create index if not exists projects_status_idx on public.projects (status);
create index if not exists projects_created_at_idx on public.projects (created_at desc);

create table if not exists public.quotes (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  client_id   uuid not null references public.clients (id) on delete restrict,
  project_id  uuid references public.projects (id) on delete set null,
  number      text not null,
  title       text not null,
  amount      numeric(12, 2),
  status      text not null default 'borrador'
                check (status in ('borrador', 'enviado', 'aceptado', 'rechazado')),
  notes       text
);

create unique index if not exists quotes_number_idx on public.quotes (number);
create index if not exists quotes_client_idx on public.quotes (client_id);
create index if not exists quotes_project_idx on public.quotes (project_id);
create index if not exists quotes_status_idx on public.quotes (status);

create table if not exists public.invoices (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  client_id   uuid not null references public.clients (id) on delete restrict,
  project_id  uuid references public.projects (id) on delete set null,
  quote_id    uuid references public.quotes (id) on delete set null,
  number      text not null,
  title       text,
  amount      numeric(12, 2) not null default 0,
  status      text not null default 'borrador'
                check (status in ('borrador', 'emitida', 'cobrada', 'anulada')),
  notes       text
);

create unique index if not exists invoices_number_idx on public.invoices (number);
create index if not exists invoices_client_idx on public.invoices (client_id);
create index if not exists invoices_project_idx on public.invoices (project_id);
create index if not exists invoices_status_idx on public.invoices (status);

alter table public.contact_submissions
  add column if not exists client_id uuid references public.clients (id) on delete set null;

create index if not exists contact_submissions_client_idx
  on public.contact_submissions (client_id);

alter table public.clients             enable row level security;
alter table public.projects            enable row level security;
alter table public.quotes              enable row level security;
alter table public.invoices            enable row level security;

drop policy if exists "admin gestiona clientes"      on public.clients;
drop policy if exists "admin gestiona proyectos"     on public.projects;
drop policy if exists "admin gestiona presupuestos"  on public.quotes;
drop policy if exists "admin gestiona facturas"      on public.invoices;

create policy "admin gestiona clientes" on public.clients
  for all to authenticated using (true) with check (true);

create policy "admin gestiona proyectos" on public.projects
  for all to authenticated using (true) with check (true);

create policy "admin gestiona presupuestos" on public.quotes
  for all to authenticated using (true) with check (true);

create policy "admin gestiona facturas" on public.invoices
  for all to authenticated using (true) with check (true);
