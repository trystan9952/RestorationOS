-- RestorationOS: company-owned price catalog
--
-- SAFE TO RUN independently of losses/rooms/estimates.
-- This migration does NOT create, alter, or drop losses, rooms, estimates,
-- estimate_areas, estimate_line_items, or room_measurements.
--
-- Catalog items are global for the MVP (no loss_id / company_id yet).
-- Estimate line items copy description/unit/unit_price as snapshots —
-- there is intentionally no foreign key from estimate_line_items here.

create table if not exists public.price_catalog_items (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  name text not null,
  description text null,
  unit text not null,
  unit_price numeric(12, 2) not null default 0
    check (unit_price >= 0),
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint price_catalog_items_category_not_blank
    check (length(trim(category)) > 0),
  constraint price_catalog_items_name_not_blank
    check (length(trim(name)) > 0),
  constraint price_catalog_items_unit_not_blank
    check (length(trim(unit)) > 0)
);

create index if not exists price_catalog_items_active_category_sort_idx
  on public.price_catalog_items (active, category, sort_order);

create index if not exists price_catalog_items_category_idx
  on public.price_catalog_items (category);

alter table public.price_catalog_items enable row level security;

-- TODO: Replace this open RLS policy with authenticated, tenant/company-scoped policies before beta.
drop policy if exists "price_catalog_items_anon_all" on public.price_catalog_items;
create policy "price_catalog_items_anon_all"
  on public.price_catalog_items
  for all
  to anon, authenticated
  using (true)
  with check (true);
