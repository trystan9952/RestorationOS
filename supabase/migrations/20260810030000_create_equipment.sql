-- RestorationOS: persistent room equipment tracking
--
-- SAFE TO RUN when public.losses and public.rooms already exist.
-- This migration does NOT create, alter, or drop losses, rooms, photos,
-- moisture_readings, or room_notes.
--
-- TODO: Future Digital Twin may attach equipment to Wall and track runtime/logs.
-- This MVP attaches equipment to loss + room only (no Wall relationships).

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
-- equipment
-- ---------------------------------------------------------------------------
create table if not exists public.equipment (
  id uuid primary key default gen_random_uuid(),
  loss_id uuid not null references public.losses (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  equipment_type text not null,
  asset_number text,
  status text not null,
  location text not null,
  placed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists equipment_room_id_idx
  on public.equipment (room_id);

alter table public.equipment enable row level security;

-- TODO: Replace this open RLS policy with authenticated, tenant-scoped policies before beta.
drop policy if exists "equipment_anon_all" on public.equipment;
create policy "equipment_anon_all"
  on public.equipment
  for all
  to anon, authenticated
  using (true)
  with check (true);
