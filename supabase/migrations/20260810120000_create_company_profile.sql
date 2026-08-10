-- RestorationOS: global company profile + company-assets Storage bucket
--
-- SAFE TO RUN independently of losses/estimates data.
-- Does NOT modify estimates, estimate_areas, estimate_line_items, losses, or rooms.
--
-- MVP: one company profile (singleton). Future: scope by organization/tenant.
--
-- TODO: Replace open RLS policies with authenticated, tenant/company-scoped
-- policies before beta.

-- ---------------------------------------------------------------------------
-- company_profile (singleton)
-- ---------------------------------------------------------------------------
create table if not exists public.company_profile (
  id uuid primary key default gen_random_uuid(),
  singleton_key boolean not null default true,
  company_name text not null,
  phone text null,
  email text null,
  website text null,
  address text null,
  logo_url text null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint company_profile_singleton_true check (singleton_key = true),
  constraint company_profile_singleton_uidx unique (singleton_key)
);

alter table public.company_profile enable row level security;

-- TODO: Replace this open RLS policy with authenticated, tenant-scoped policies before beta.
drop policy if exists "company_profile_anon_all" on public.company_profile;
create policy "company_profile_anon_all"
  on public.company_profile
  for all
  to anon, authenticated
  using (true)
  with check (true);

comment on table public.company_profile is
  'Global company branding for estimates/PDF/email. Singleton for MVP; future org-scoped.';

-- ---------------------------------------------------------------------------
-- Storage: company-assets bucket (public read for MVP logo_url)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-assets',
  'company-assets',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
)
on conflict (id) do nothing;

-- TODO: Replace this open RLS policy with authenticated, tenant-scoped policies before beta.
drop policy if exists "company_assets_storage_select" on storage.objects;
create policy "company_assets_storage_select"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'company-assets');

-- TODO: Replace this open RLS policy with authenticated, tenant-scoped policies before beta.
drop policy if exists "company_assets_storage_insert" on storage.objects;
create policy "company_assets_storage_insert"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'company-assets');

-- TODO: Replace this open RLS policy with authenticated, tenant-scoped policies before beta.
drop policy if exists "company_assets_storage_update" on storage.objects;
create policy "company_assets_storage_update"
  on storage.objects
  for update
  to anon, authenticated
  using (bucket_id = 'company-assets')
  with check (bucket_id = 'company-assets');

-- TODO: Replace this open RLS policy with authenticated, tenant-scoped policies before beta.
drop policy if exists "company_assets_storage_delete" on storage.objects;
create policy "company_assets_storage_delete"
  on storage.objects
  for delete
  to anon, authenticated
  using (bucket_id = 'company-assets');
