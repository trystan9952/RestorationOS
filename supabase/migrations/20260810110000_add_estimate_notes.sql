-- RestorationOS: estimate-level notes for professional estimate document
--
-- SAFE TO RUN when public.estimates already exists.
-- Does NOT modify estimate_areas, estimate_line_items, losses, or rooms.
--
-- notes is nullable estimate-level text (not room notes).

do $$
begin
  if to_regclass('public.estimates') is null then
    raise exception 'public.estimates must already exist.';
  end if;
end $$;

alter table public.estimates
  add column if not exists notes text null;

comment on column public.estimates.notes is
  'Optional estimate-level notes shown on the professional estimate document. Not room notes.';
