-- RestorationOS: estimate foundation (estimate → areas → line items)
--
-- SAFE TO RUN when public.losses and public.rooms already exist.
-- This migration does NOT create, alter, or drop losses, rooms, photos,
-- moisture_readings, room_notes, equipment, or room_scope_items.
--
-- One estimate per loss (unique loss_id).
-- estimate_areas.room_id is nullable; deleting a room sets room_id to NULL
-- so estimate integrity is preserved.

do $$
begin
  if to_regclass('public.losses') is null then
    raise exception 'public.losses must already exist. This migration does not create losses.';
  end if;

  if to_regclass('public.rooms') is null then
    raise exception 'public.rooms must already exist. This migration does not create rooms.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- estimates
-- ---------------------------------------------------------------------------
create table if not exists public.estimates (
  id uuid primary key default gen_random_uuid(),
  loss_id uuid not null references public.losses (id) on delete cascade,
  status text not null default 'Draft'
    check (status in ('Draft', 'Complete')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists estimates_loss_id_uidx
  on public.estimates (loss_id);

alter table public.estimates enable row level security;

-- TODO: Replace this open RLS policy with authenticated, tenant-scoped policies before beta.
drop policy if exists "estimates_anon_all" on public.estimates;
create policy "estimates_anon_all"
  on public.estimates
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- estimate_areas
-- ---------------------------------------------------------------------------
create table if not exists public.estimate_areas (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references public.estimates (id) on delete cascade,
  room_id uuid null references public.rooms (id) on delete set null,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists estimate_areas_estimate_id_idx
  on public.estimate_areas (estimate_id);

create index if not exists estimate_areas_room_id_idx
  on public.estimate_areas (room_id);

alter table public.estimate_areas enable row level security;

-- TODO: Replace this open RLS policy with authenticated, tenant-scoped policies before beta.
drop policy if exists "estimate_areas_anon_all" on public.estimate_areas;
create policy "estimate_areas_anon_all"
  on public.estimate_areas
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- estimate_line_items
-- ---------------------------------------------------------------------------
create table if not exists public.estimate_line_items (
  id uuid primary key default gen_random_uuid(),
  estimate_area_id uuid not null references public.estimate_areas (id) on delete cascade,
  description text not null,
  quantity numeric(12, 2) not null default 1,
  unit text not null,
  unit_price numeric(12, 2) not null default 0,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists estimate_line_items_estimate_area_id_idx
  on public.estimate_line_items (estimate_area_id);

alter table public.estimate_line_items enable row level security;

-- TODO: Replace this open RLS policy with authenticated, tenant-scoped policies before beta.
drop policy if exists "estimate_line_items_anon_all" on public.estimate_line_items;
create policy "estimate_line_items_anon_all"
  on public.estimate_line_items
  for all
  to anon, authenticated
  using (true)
  with check (true);
