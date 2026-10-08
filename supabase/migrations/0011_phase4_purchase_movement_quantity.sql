-- Phase 4 — align purchase stock movement quantity semantics
-- Purchase movements are stored as positive quantities; available stock subtracts
-- purchase quantities when calculating the remaining balance.

alter table public.stock_movements
  drop constraint if exists stock_movements_kind_quantity_check;

alter table public.stock_movements
  add constraint stock_movements_kind_quantity_check
  check (
    (kind in ('received', 'incoming', 'incoming_received', 'purchase') and quantity > 0)
    or
    (kind = 'adjustment' and quantity <> 0)
  );
