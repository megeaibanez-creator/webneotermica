-- =====================================================================
-- Neotérmica · agenda de trabajo: usuarios (staff) y actuaciones
-- =====================================================================
-- Un proyecto se divide en ACTUACIONES (fases: visita, preinstalación,
-- instalación…), cada una con fecha, lugar y uno o varios responsables.
-- De la suma de actuaciones sale el calendario de trabajo.
--
-- profiles      : staff (admin | tecnico). 1—1 con auth.users.
-- actuaciones   : project 1—* actuaciones.
-- actuacion_responsables : actuacion *—* profile.
--
-- Un técnico solo ve SUS actuaciones y los datos mínimos del cliente/obra
-- de esas actuaciones. El admin lo ve todo. El dinero (quotes/invoices)
-- deja de ser visible para 'authenticated' que no sea admin.
-- =====================================================================

-- ---------- profiles (staff) ----------------------------------------
create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  created_at  timestamptz not null default now(),
  nombre      text not null,
  rol         text not null default 'tecnico'
                check (rol in ('admin', 'tecnico')),
  color       text not null default '#2563eb',
  telefono    text,
  activo      boolean not null default true
);

create index if not exists profiles_rol_idx on public.profiles (rol);

-- ¿El usuario actual es admin activo? (SECURITY DEFINER: puede leer profiles
-- sin caer en recursión de RLS al evaluar las políticas de otras tablas).
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and rol = 'admin' and activo
  );
$$;

-- ---------- actuaciones ---------------------------------------------
create table if not exists public.actuaciones (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  project_id    uuid not null references public.projects (id) on delete cascade,
  titulo        text not null,
  tipo          text not null default 'instalacion'
                  check (tipo in ('visita', 'preinstalacion', 'instalacion',
                                  'mantenimiento', 'reparacion', 'otro')),
  starts_at     timestamptz not null,
  ends_at       timestamptz not null,
  dia_completo  boolean not null default false,
  lugar         text,
  estado        text not null default 'pendiente'
                  check (estado in ('pendiente', 'en_curso', 'hecha', 'cancelada')),
  notas         text
);

create index if not exists actuaciones_project_idx on public.actuaciones (project_id);
create index if not exists actuaciones_starts_idx  on public.actuaciones (starts_at);
create index if not exists actuaciones_estado_idx  on public.actuaciones (estado);

-- ---------- actuacion_responsables (M—M) ----------------------------
create table if not exists public.actuacion_responsables (
  actuacion_id  uuid not null references public.actuaciones (id) on delete cascade,
  profile_id    uuid not null references public.profiles (id)    on delete cascade,
  primary key (actuacion_id, profile_id)
);

create index if not exists actuacion_resp_profile_idx
  on public.actuacion_responsables (profile_id);

-- =====================================================================
-- RLS
-- =====================================================================
alter table public.profiles               enable row level security;
alter table public.actuaciones            enable row level security;
alter table public.actuacion_responsables enable row level security;

-- profiles: cualquiera del staff ve los nombres/colores (para asignar y
-- pintar el calendario); solo el admin crea/edita/borra.
drop policy if exists "staff ve perfiles"    on public.profiles;
drop policy if exists "admin gestiona perfiles" on public.profiles;
create policy "staff ve perfiles" on public.profiles
  for select to authenticated using (true);
create policy "admin gestiona perfiles" on public.profiles
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- actuaciones: admin todo; técnico ve/edita las suyas (columnas acotadas por GRANT).
drop policy if exists "admin gestiona actuaciones" on public.actuaciones;
drop policy if exists "tecnico ve sus actuaciones" on public.actuaciones;
drop policy if exists "tecnico actualiza sus actuaciones" on public.actuaciones;
create policy "admin gestiona actuaciones" on public.actuaciones
  for all to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "tecnico ve sus actuaciones" on public.actuaciones
  for select to authenticated using (
    exists (
      select 1 from public.actuacion_responsables ar
      where ar.actuacion_id = actuaciones.id and ar.profile_id = auth.uid()
    )
  );
create policy "tecnico actualiza sus actuaciones" on public.actuaciones
  for update to authenticated using (
    exists (
      select 1 from public.actuacion_responsables ar
      where ar.actuacion_id = actuaciones.id and ar.profile_id = auth.uid()
    )
  );

-- actuacion_responsables: admin todo; técnico ve solo sus asignaciones.
drop policy if exists "admin gestiona asignaciones" on public.actuacion_responsables;
drop policy if exists "tecnico ve sus asignaciones" on public.actuacion_responsables;
create policy "admin gestiona asignaciones" on public.actuacion_responsables
  for all to authenticated using (public.es_admin()) with check (public.es_admin());
create policy "tecnico ve sus asignaciones" on public.actuacion_responsables
  for select to authenticated using (profile_id = auth.uid());

-- ---------- cerrar el taller a los técnicos --------------------------
-- Hasta ahora clients/projects/quotes/invoices eran 'for all using(true)'.
-- El admin trabaja por service_role (salta RLS), así que endurecer aquí no
-- rompe el panel; solo tapa que un técnico consulte el taller con su token.

drop policy if exists "admin gestiona clientes"  on public.clients;
create policy "admin gestiona clientes" on public.clients
  for all to authenticated using (public.es_admin()) with check (public.es_admin());
-- técnico: solo el cliente de una obra en la que tiene actuación asignada.
drop policy if exists "tecnico ve clientes de sus obras" on public.clients;
create policy "tecnico ve clientes de sus obras" on public.clients
  for select to authenticated using (
    exists (
      select 1
      from public.projects p
      join public.actuaciones a           on a.project_id = p.id
      join public.actuacion_responsables ar on ar.actuacion_id = a.id
      where p.client_id = clients.id and ar.profile_id = auth.uid()
    )
  );

drop policy if exists "admin gestiona proyectos" on public.projects;
create policy "admin gestiona proyectos" on public.projects
  for all to authenticated using (public.es_admin()) with check (public.es_admin());
-- técnico: solo las obras en las que tiene actuación asignada.
drop policy if exists "tecnico ve sus obras" on public.projects;
create policy "tecnico ve sus obras" on public.projects
  for select to authenticated using (
    exists (
      select 1
      from public.actuaciones a
      join public.actuacion_responsables ar on ar.actuacion_id = a.id
      where a.project_id = projects.id and ar.profile_id = auth.uid()
    )
  );
-- Nota: el portafolio público (publicable = true) sigue con su política anon.

drop policy if exists "admin gestiona presupuestos" on public.quotes;
create policy "admin gestiona presupuestos" on public.quotes
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

drop policy if exists "admin gestiona facturas" on public.invoices;
create policy "admin gestiona facturas" on public.invoices
  for all to authenticated using (public.es_admin()) with check (public.es_admin());

-- =====================================================================
-- GRANTS
-- =====================================================================
grant all on table
  public.profiles,
  public.actuaciones,
  public.actuacion_responsables
  to service_role;

grant select on table public.profiles to authenticated;
grant select on table public.actuaciones to authenticated;
grant update (estado, notas) on table public.actuaciones to authenticated;
grant select on table public.actuacion_responsables to authenticated;

grant execute on function public.es_admin() to anon, authenticated, service_role;

-- =====================================================================
-- SEED: el socio (megeaibanez) queda como admin si ya tiene cuenta Auth.
-- Los futuros técnicos se crean desde /administrator/equipo.
-- =====================================================================
insert into public.profiles (id, nombre, rol)
select u.id,
       coalesce(nullif(u.raw_user_meta_data->>'full_name', ''), split_part(u.email, '@', 1)),
       'admin'
from auth.users u
where lower(u.email) = 'megeaibanez@gmail.com'
on conflict (id) do update set rol = 'admin', activo = true;
