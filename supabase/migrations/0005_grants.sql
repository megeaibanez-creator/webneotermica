-- Los 0001–0004 crean tablas y RLS, pero en proyectos nuevos (FREE, 2026)
-- `service_role` no recibe GRANT por defecto. Sin esto la API responde 403
-- y el formulario / el chat / el ingest no pueden escribir.

grant usage on schema public to postgres, anon, authenticated, service_role;

grant all on table
  public.contact_submissions,
  public.chat_threads,
  public.chat_messages,
  public.chatbot_kb,
  public.chat_reviews,
  public.clients,
  public.projects,
  public.quotes,
  public.invoices
  to service_role;

grant select, update on table public.contact_submissions to authenticated;
grant select on table public.chat_threads to authenticated;
grant select on table public.chat_messages to authenticated;
grant select on table public.chatbot_kb to authenticated;
grant all on table public.chat_reviews to authenticated;
grant all on table public.clients to authenticated;
grant all on table public.projects to authenticated;
grant all on table public.quotes to authenticated;
grant all on table public.invoices to authenticated;

-- Porfolio público: RLS (`publicable = true`) + este GRANT.
grant select on table public.projects to anon;

grant execute on function public.match_chatbot_kb(vector, float, int)
  to anon, authenticated, service_role;
