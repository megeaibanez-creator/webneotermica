-- Ficha pública de obra (porfolio). Precio y cliente no salen a la calle.
alter table public.projects
  add column if not exists m2 numeric,
  add column if not exists amount numeric,
  add column if not exists photos jsonb not null default '[]'::jsonb,
  add column if not exists publicable boolean not null default false,
  add column if not exists slug text,
  add column if not exists public_title text,
  add column if not exists public_excerpt text,
  add column if not exists public_body text;

create unique index if not exists projects_slug_idx
  on public.projects (slug)
  where slug is not null;

drop policy if exists "publico lee obras publicables" on public.projects;
create policy "publico lee obras publicables" on public.projects
  for select to anon, authenticated
  using (publicable = true);
