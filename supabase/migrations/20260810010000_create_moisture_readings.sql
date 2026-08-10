-- RestorationOS: persistent room moisture readings
--
-- SAFE TO RUN when public.losses and public.rooms already exist.
-- This migration does NOT create, alter, or drop losses, rooms, or photos.
--
-- TODO: Future Digital Twin may attach moisture readings to Wall.
-- This MVP attaches readings to loss + room only (no Wall relationships).

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
-- moisture_readings
-- ---------------------------------------------------------------------------
create table if not exists public.moisture_readings (
  id uuid primary key default gen_random_uuid(),
  loss_id uuid not null references public.losses (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  material text not null,
  reading numeric(6, 2) not null,
  location text not null,
  created_at timestamptz not null default now()
);

create index if not exists moisture_readings_room_id_idx
  on public.moisture_readings (room_id);

alter table public.moisture_readings enable row level security;

-- TODO: Replace this open RLS policy with authenticated, tenant-scoped policies before beta.
drop policy if exists "moisture_readings_anon_all" on public.moisture_readings;
create policy "moisture_readings_anon_all"
  on public.moisture_readings
  for all
  to anon, authenticated
  using (true)
  with check (true);
