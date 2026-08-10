-- RestorationOS: room measurements (length / width / ceiling height)
--
-- SAFE TO RUN when public.losses and public.rooms already exist.
-- This migration does NOT create, alter, or drop losses, rooms, photos,
-- moisture_readings, room_notes, equipment, room_scope_items, estimates,
-- estimate_areas, or estimate_line_items.
--
-- One measurement record per room (unique room_id).
-- Calculated quantities (floor area, wall area, etc.) are application-layer only.

do $$
begin
  if to_regclass('public.losses') is null then
    raise exception 'public.losses must already exist. This migration does not create losses.';
  end if;

  if to_regclass('public.rooms') is null then
    raise exception 'public.rooms must already exist. This migration does not create rooms.';
  end if;
end $$;

create table if not exists public.room_measurements (
  id uuid primary key default gen_random_uuid(),
  loss_id uuid not null references public.losses (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  length_ft numeric(10, 2) not null
    check (length_ft > 0),
  width_ft numeric(10, 2) not null
    check (width_ft > 0),
  ceiling_height_ft numeric(10, 2) not null
    check (ceiling_height_ft > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists room_measurements_room_id_uidx
  on public.room_measurements (room_id);

create index if not exists room_measurements_loss_id_idx
  on public.room_measurements (loss_id);

alter table public.room_measurements enable row level security;

-- TODO: Replace this open RLS policy with authenticated, tenant-scoped policies before beta.
drop policy if exists "room_measurements_anon_all" on public.room_measurements;
create policy "room_measurements_anon_all"
  on public.room_measurements
  for all
  to anon, authenticated
  using (true)
  with check (true);
