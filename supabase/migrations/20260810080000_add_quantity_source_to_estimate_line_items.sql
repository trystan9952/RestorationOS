-- RestorationOS: persist estimate line item quantity source
--
-- SAFE TO RUN when public.estimate_line_items already exists.
-- Does NOT modify losses, rooms, room_measurements, estimates, or estimate_areas.
--
-- quantity_source records whether quantity was entered manually or derived
-- from a room measurement calculated quantity. Calculated values themselves
-- are NOT stored — only the source label is persisted.

do $$
begin
  if to_regclass('public.estimate_line_items') is null then
    raise exception 'public.estimate_line_items must already exist.';
  end if;
end $$;

alter table public.estimate_line_items
  add column if not exists quantity_source text not null default 'manual';

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'estimate_line_items_quantity_source_check'
  ) then
    alter table public.estimate_line_items
      add constraint estimate_line_items_quantity_source_check
      check (
        quantity_source in (
          'manual',
          'floor_area',
          'ceiling_area',
          'wall_area',
          'perimeter'
        )
      );
  end if;
end $$;

comment on column public.estimate_line_items.quantity_source is
  'manual | floor_area | ceiling_area | wall_area | perimeter. Calculated quantities are derived at runtime from room_measurements.';
