-- Rango de presupuesto del formulario (priorizar leads).
-- Idempotente: se puede lanzar aunque 0001 ya lo traiga.

alter table public.contact_submissions
  add column if not exists budget_range text;
