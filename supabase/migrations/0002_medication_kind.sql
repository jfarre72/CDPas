-- ============================================================
-- 0002 · Tipo de medicamento: "dose" (con dosis) o "unit" (por unidad)
-- Aditivo. Default 'dose' para no romper los medicamentos existentes.
-- ============================================================

do $$ begin
  create type pill_medication_kind as enum ('dose', 'unit');
exception when duplicate_object then null; end $$;

alter table pill_medications
  add column if not exists kind pill_medication_kind not null default 'dose';
