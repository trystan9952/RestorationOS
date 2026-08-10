-- RestorationOS: persistent room photos (metadata + Storage bucket)
--
-- SAFE TO RUN when public.losses and public.rooms already exist.
-- This migration does NOT create, alter, or drop losses or rooms.
--
-- TODO: Future Digital Twin will organize photos by Building → Floor → Room → Wall.
-- This MVP attaches photos to loss + room only (no Wall relationships).

-- Preconditions: prior migration already created losses + rooms.
do $$
begin
  if to_regclass('public.losses') is null then
    raise exception 'public.losses must already exist. Run 20260322000000_create_losses_rooms.sql first. This migration does not create losses.';
  end if;

  if to_regclass('public.rooms') is null then
    raise exception 'public.rooms must already exist. Run 20260322000000_create_losses_rooms.sql first. This migration does not create rooms.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- photos (only)
-- ---------------------------------------------------------------------------
create table if not exists public.photos (
  id uuid primary key default gen_random_uuid(),
  loss_id uuid not null references public.losses (id) on delete cascade,
  room_id uuid not null references public.rooms (id) on delete cascade,
  storage_path text not null,
  public_url text not null,
  original_filename text not null,
  created_at timestamptz not null default now()
);

create index if not exists photos_room_id_idx on public.photos (room_id);
create index if not exists photos_loss_id_idx on public.photos (loss_id);

alter table public.photos enable row level security;

-- TODO: Replace this open RLS policy with authenticated, tenant-scoped policies before beta.
drop policy if exists "photos_anon_all" on public.photos;
create policy "photos_anon_all"
  on public.photos
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- ---------------------------------------------------------------------------
-- Storage: room-photos bucket (public read for MVP public_url)
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'room-photos',
  'room-photos',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif']
)
on conflict (id) do nothing;

-- TODO: Replace this open RLS policy with authenticated, tenant-scoped policies before beta.
drop policy if exists "room_photos_storage_select" on storage.objects;
create policy "room_photos_storage_select"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'room-photos');

-- TODO: Replace this open RLS policy with authenticated, tenant-scoped policies before beta.
drop policy if exists "room_photos_storage_insert" on storage.objects;
create policy "room_photos_storage_insert"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'room-photos');

-- TODO: Replace this open RLS policy with authenticated, tenant-scoped policies before beta.
drop policy if exists "room_photos_storage_update" on storage.objects;
create policy "room_photos_storage_update"
  on storage.objects
  for update
  to anon, authenticated
  using (bucket_id = 'room-photos')
  with check (bucket_id = 'room-photos');

-- TODO: Replace this open RLS policy with authenticated, tenant-scoped policies before beta.
drop policy if exists "room_photos_storage_delete" on storage.objects;
create policy "room_photos_storage_delete"
  on storage.objects
  for delete
  to anon, authenticated
  using (bucket_id = 'room-photos');
