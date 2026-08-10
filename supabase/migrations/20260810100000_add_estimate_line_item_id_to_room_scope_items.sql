-- RestorationOS: link room scope items to estimate line items (optional)
--
-- SAFE TO RUN when public.room_scope_items and public.estimate_line_items exist.
-- Does NOT modify previous migrations or other tables.
--
-- Workflow-only link: Scope → Estimate line item.
-- Deleting the estimate line item clears the link (ON DELETE SET NULL).
-- Scope rows themselves are never deleted by estimate changes.

do $$
begin
  if to_regclass('public.room_scope_items') is null then
    raise exception 'public.room_scope_items must already exist.';
  end if;

  if to_regclass('public.estimate_line_items') is null then
    raise exception 'public.estimate_line_items must already exist.';
  end if;
end $$;

alter table public.room_scope_items
  add column if not exists estimate_line_item_id uuid null
    references public.estimate_line_items (id)
    on delete set null;

create index if not exists room_scope_items_estimate_line_item_id_idx
  on public.room_scope_items (estimate_line_item_id);

comment on column public.room_scope_items.estimate_line_item_id is
  'Optional link to an estimate line item created via Add to Estimate. Cleared when the line item is deleted.';
