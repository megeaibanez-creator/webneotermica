-- =====================================================================
-- Neotérmica · candidatos de /oferta-empleo
-- Tabla propia: no se mezclan con los leads de /contacto.
-- Escritura solo por service_role (API). El visitante no escribe por anon.
-- =====================================================================

create table if not exists public.job_applications (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),

  name             text not null,
  email            text not null,
  phone            text not null,
  municipio        text,

  puesto           text,
  formacion        text,
  experiencia      text,
  edad             text,
  carnet           text,
  disponibilidad   text,
  message          text,

  gdpr_consent     boolean not null default false,

  status           text not null default 'new'
                     check (status in ('new', 'reviewed', 'interview', 'hired', 'discarded', 'spam')),
  is_read          boolean not null default false,
  spam_reason      text
);

create index if not exists job_applications_created_at_idx
  on public.job_applications (created_at desc);
create index if not exists job_applications_status_idx
  on public.job_applications (status);

alter table public.job_applications enable row level security;

drop policy if exists "admin lee candidatos" on public.job_applications;
drop policy if exists "admin edita candidatos" on public.job_applications;

create policy "admin lee candidatos" on public.job_applications
  for select to authenticated using (true);

create policy "admin edita candidatos" on public.job_applications
  for update to authenticated using (true) with check (true);

grant all on table public.job_applications to service_role;
grant select, update on table public.job_applications to authenticated;
