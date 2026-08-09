-- RestorationOS MVP: losses + rooms
-- No auth / organizations / users in this migration.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- losses
-- ---------------------------------------------------------------------------
create table public.losses (
  id uuid primary key default gen_random_uuid(),
  address text not null default '',
  customer text not null default '',
  phone text not null default '',
  insurance text not null default '',
  claim_number text not null default '',
  status text not null default 'Initializing'
    check (status in ('Initializing', 'Inspection', 'Drying', 'Complete')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- rooms
-- ---------------------------------------------------------------------------
create table public.rooms (
  id uuid primary key default gen_random_uuid(),
  loss_id uuid not null references public.losses (id) on delete cascade,
  name text not null,
  floor integer not null default 1,
  category smallint not null default 1 check (category in (1, 2, 3)),
  class smallint not null default 1 check (class in (1, 2, 3, 4)),
  affected boolean not null default true,
  created_at timestamptz not null default now()
);

create index rooms_loss_id_idx on public.rooms (loss_id);

-- ---------------------------------------------------------------------------
-- photos
-- TODO: Do not create the photos table yet.
-- Future Digital Twin will organize photos by Building → Floor → Room → Wall.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------
alter table public.losses enable row level security;
alter table public.rooms enable row level security;

-- TODO: Replace this open RLS policy with authenticated, tenant-scoped policies before beta.
create policy "losses_anon_all"
  on public.losses
  for all
  to anon, authenticated
  using (true)
  with check (true);

-- TODO: Replace this open RLS policy with authenticated, tenant-scoped policies before beta.
create policy "rooms_anon_all"
  on public.rooms
  for all
  to anon, authenticated
  using (true)
  with check (true);
