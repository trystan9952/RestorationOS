-- RestorationOS: add nullable source/code to price catalog items
--
-- SAFE TO RUN when public.price_catalog_items already exists.
-- Does NOT modify estimates, losses, rooms, or existing catalog values.
--
-- code is nullable so existing catalog rows remain valid.
-- Codes are not globally unique in the MVP.
--
-- TODO: Scope price catalog by authenticated company/tenant before beta.

do $$
begin
  if to_regclass('public.price_catalog_items') is null then
    raise exception 'public.price_catalog_items must already exist.';
  end if;
end $$;

alter table public.price_catalog_items
  add column if not exists code text null;

create index if not exists price_catalog_items_code_idx
  on public.price_catalog_items (code);

comment on column public.price_catalog_items.code is
  'Optional source catalog/code from company price book (e.g. WTRINS). Nullable for legacy items.';
