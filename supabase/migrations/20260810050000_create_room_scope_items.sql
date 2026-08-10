-- RestorationOS: persistent room scope / work items
--
-- SAFE TO RUN when public.losses and public.rooms already exist.
-- This migration does NOT create, alter, or drop losses, rooms, photos,
-- moisture_readings, room_notes, or equipment.
--
-- TODO: Future Digital Twin may attach scope items to Wall / estimate lines.
-- This MVP attaches scope items to loss + room only (no Wall relationships).

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
-- room_scope_items
-- ---------------------------------------------------------------------------
create table if not exists public.room_scope_items (
  id uuid primary key default gen_random_uuid(),
  loss_id uuid not null references public.losses (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  description text not null,
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists room_scope_items_room_id_idx
  on public.room_scope_items (room_id);

alter table public.room_scope_items enable row level security;

-- TODO: Replace this open RLS policy with authenticated, tenant-scoped policies before beta.
drop policy if exists "room_scope_items_anon_all" on public.room_scope_items;
create policy "room_scope_items_anon_all"
  on public.room_scope_items
  for all
  to anon, authenticated
  using (true)
  with check (true);
