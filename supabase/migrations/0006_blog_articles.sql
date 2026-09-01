-- Blog del sitio (los 21 slugs de WordPress). El markdown de content/blog/
-- se copia aquí; las portadas JPG siguen en public/images/blog/.
-- chatbot_kb es el RAG, no esta tabla.

create table if not exists public.blog_articles (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  slug        text not null unique,
  title       text not null,
  date        date not null,
  description text not null default '',
  status      text not null default 'published'
                check (status in ('published', 'scheduled')),
  servicio    text,
  cover       text,
  reescrito   boolean not null default false,
  content     text not null
);

create index if not exists blog_articles_date_idx
  on public.blog_articles (date desc);
create index if not exists blog_articles_status_idx
  on public.blog_articles (status);

alter table public.blog_articles enable row level security;

drop policy if exists "publico lee posts publicados" on public.blog_articles;
create policy "publico lee posts publicados" on public.blog_articles
  for select to anon, authenticated
  using (status = 'published' and date <= current_date);

drop policy if exists "admin gestiona blog" on public.blog_articles;
create policy "admin gestiona blog" on public.blog_articles
  for all to authenticated using (true) with check (true);

grant all on table public.blog_articles to service_role;
grant select on table public.blog_articles to anon;
grant all on table public.blog_articles to authenticated;
