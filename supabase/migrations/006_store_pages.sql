-- ============================================================
-- D2: store_pages — Custom pages for each store
-- About, FAQ, Contact, Privacy, Return Policy, etc.
-- ============================================================

create table if not exists public.store_pages (
  id               uuid        default gen_random_uuid() primary key,
  store_id         uuid        not null references public.stores(id) on delete cascade,
  title            text        not null check (char_length(title) between 1 and 200),
  slug             text        not null check (
                                  slug ~ '^[a-z0-9][a-z0-9-]*[a-z0-9]$'
                                  or slug ~ '^[a-z0-9]{2}$'
                               ),
  status           text        not null default 'draft'
                               check (status in ('draft', 'published')),
  sections_config  jsonb       not null default '[]'::jsonb,
  meta_title       text        check (meta_title is null or char_length(meta_title) <= 100),
  meta_description text        check (meta_description is null or char_length(meta_description) <= 300),
  show_in_header   boolean     not null default false,
  show_in_footer   boolean     not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint store_pages_unique_slug unique (store_id, slug)
);

-- ── Indexes ────────────────────────────────────────────────────
create index if not exists idx_store_pages_store_id
  on public.store_pages(store_id);

create index if not exists idx_store_pages_slug
  on public.store_pages(store_id, slug);

create index if not exists idx_store_pages_status
  on public.store_pages(store_id, status);

-- ── RLS ────────────────────────────────────────────────────────
alter table public.store_pages enable row level security;

-- Merchants manage their own store's pages
create policy "Merchants manage their own pages"
  on public.store_pages
  for all
  to authenticated
  using (
    store_id in (select id from public.stores where owner_id = auth.uid())
  )
  with check (
    store_id in (select id from public.stores where owner_id = auth.uid())
  );

-- Public can read published pages for storefront rendering
create policy "Public read published pages"
  on public.store_pages
  for select
  to anon
  using (status = 'published');

-- ── updated_at trigger ─────────────────────────────────────────
-- (Function may already exist from other migrations — safe to replace)
create or replace function public.handle_store_pages_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists store_pages_updated_at on public.store_pages;

create trigger store_pages_updated_at
  before update on public.store_pages
  for each row execute procedure public.handle_store_pages_updated_at();
