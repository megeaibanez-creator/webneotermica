-- =====================================================================
-- Neotérmica · perfiles: separar "nivel de acceso" de "hace de técnico"
-- =====================================================================
-- rol         : admin (panel completo) | tecnico (solo su zona)
-- es_tecnico  : además trabaja en campo → se le asignan actuaciones y ve
--               la vista de técnico. Así:
--                 · admin puro           → rol=admin,   es_tecnico=false
--                 · admin + técnico      → rol=admin,   es_tecnico=true
--                 · técnico              → rol=tecnico  (es_tecnico implícito)
-- =====================================================================

alter table public.profiles
  add column if not exists es_tecnico boolean not null default false;

-- Los que ya son 'tecnico' hacen de técnico por definición.
update public.profiles set es_tecnico = true where rol = 'tecnico';
