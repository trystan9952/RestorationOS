-- RestorationOS: persistent room notes
--
-- SAFE TO RUN when public.losses and public.rooms already exist.
-- This migration does NOT create, alter, or drop losses, rooms, photos, or moisture_readings.
--
-- TODO: Future Digital Twin may attach notes to Wall.
-- This MVP attaches notes to loss + room only (no Wall relationships).

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
-- room_notes
-- ---------------------------------------------------------------------------
create table if not exists public.room_notes (
  id uuid primary key default gen_random_uuid(),
  loss_id uuid not null references public.losses (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  note text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists room_notes_room_id_idx
  on public.room_notes (room_id);

alter table public.room_notes enable row level security;

-- TODO: Replace this open RLS policy with authenticated, tenant-scoped policies before beta.
drop policy if exists "room_notes_anon_all" on public.room_notes;
create policy "room_notes_anon_all"
  on public.room_notes
  for all
  to anon, authenticated
  using (true)
  with check (true);
