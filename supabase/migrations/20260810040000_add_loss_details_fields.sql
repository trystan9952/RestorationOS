-- RestorationOS: loss details + status workflow fields
--
-- SAFE TO RUN when public.losses already exists.
-- This migration does NOT recreate losses or modify rooms/photos/moisture/notes/equipment.
--
-- Adds:
--   - loss_type
--   - date_of_loss
-- Updates existing status values:
--   - Initializing → New
--   - Adds Mitigation to allowed statuses

do $$
begin
  if to_regclass('public.losses') is null then
    raise exception 'public.losses must already exist. This migration does not create losses.';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- loss_type
-- ---------------------------------------------------------------------------
alter table public.losses
  add column if not exists loss_type text;

update public.losses
set loss_type = 'Other'
where loss_type is null;

alter table public.losses
  alter column loss_type set default 'Other';

alter table public.losses
  alter column loss_type set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'losses_loss_type_check'
  ) then
    alter table public.losses
      add constraint losses_loss_type_check
      check (loss_type in ('Water', 'Fire', 'Mold', 'Other'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- date_of_loss
-- ---------------------------------------------------------------------------
alter table public.losses
  add column if not exists date_of_loss date;

update public.losses
set date_of_loss = created_at::date
where date_of_loss is null;

alter table public.losses
  alter column date_of_loss set default current_date;

alter table public.losses
  alter column date_of_loss set not null;

-- ---------------------------------------------------------------------------
-- status workflow values
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'losses_status_check'
  ) then
    alter table public.losses drop constraint losses_status_check;
  end if;
end $$;

update public.losses
set status = 'New'
where status = 'Initializing';

alter table public.losses
  alter column status set default 'New';

alter table public.losses
  add constraint losses_status_check
  check (status in ('New', 'Inspection', 'Mitigation', 'Drying', 'Complete'));
