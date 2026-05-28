-- ============================================================
-- MÓDULO PASTILLERO / CALENDARIO DE MEDICACIÓN (DIFED)
-- Tablas aisladas con prefijo pill_  (single-user, sin auth/RLS)
-- 100% aditivo: no toca ni referencia ninguna tabla existente de DIFED.
-- Pegar y ejecutar completo en el SQL Editor de Supabase.
-- ============================================================

create extension if not exists "pgcrypto";

-- ------------------------------------------------------------
-- ENUMS (con prefijo para no colisionar)
-- ------------------------------------------------------------
do $$ begin
  create type pill_duration_unit as enum ('days', 'weeks', 'months');
exception when duplicate_object then null; end $$;

do $$ begin
  create type pill_event_status as enum ('pendiente', 'tomada', 'omitida', 'pospuesta');
exception when duplicate_object then null; end $$;

-- ------------------------------------------------------------
-- Trigger genérico para updated_at
-- ------------------------------------------------------------
create or replace function pill_set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================
-- 1) MEDICAMENTOS
--    Cada dosis = un medicamento distinto (Prednisona 1mg ≠ 0.5mg)
-- ============================================================
create table if not exists pill_medications (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  dose        numeric,                 -- ej: 1, 0.5, 20
  unit        text,                    -- ej: 'mg', 'comprimido', 'ml'
  color       text not null default '#3b82f6', -- color identificatorio (hex)
  notes       text,
  active      boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create trigger pill_medications_set_updated_at
  before update on pill_medications
  for each row execute function pill_set_updated_at();

-- ============================================================
-- 2) TRATAMIENTOS (programación de un medicamento)
-- ============================================================
create table if not exists pill_treatments (
  id                uuid primary key default gen_random_uuid(),
  medication_id     uuid not null references pill_medications(id) on delete cascade,
  start_date        date not null,
  duration_value    integer,                 -- cantidad
  duration_unit     pill_duration_unit,      -- days | weeks | months
  end_date          date,                    -- opcional (calculada o manual)
  quantity_per_dose numeric not null default 1, -- cantidad por toma
  alarm_enabled     boolean not null default true,
  notes             text,
  active            boolean not null default true,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists pill_treatments_medication_idx on pill_treatments(medication_id);

create trigger pill_treatments_set_updated_at
  before update on pill_treatments
  for each row execute function pill_set_updated_at();

-- ============================================================
-- 3) SCHEDULES (días de la semana × horarios)
--    Una fila por combinación (día, hora).
--    day_of_week ISO: 1=lunes ... 7=domingo
-- ============================================================
create table if not exists pill_treatment_schedules (
  id           uuid primary key default gen_random_uuid(),
  treatment_id uuid not null references pill_treatments(id) on delete cascade,
  day_of_week  smallint not null check (day_of_week between 1 and 7),
  time_of_day  time not null,
  created_at   timestamptz not null default now(),
  unique (treatment_id, day_of_week, time_of_day)
);

create index if not exists pill_schedules_treatment_idx on pill_treatment_schedules(treatment_id);

-- ============================================================
-- 4) EVENTS (tomas concretas pre-generadas por fecha + hora)
--    La generación automática se implementará más adelante.
-- ============================================================
create table if not exists pill_events (
  id              uuid primary key default gen_random_uuid(),
  treatment_id    uuid not null references pill_treatments(id) on delete cascade,
  medication_id   uuid not null references pill_medications(id) on delete cascade,
  scheduled_date  date not null,
  scheduled_time  time not null,
  quantity        numeric not null default 1,
  status          pill_event_status not null default 'pendiente',
  taken_at        timestamptz,
  postponed_until timestamptz,
  notes           text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index if not exists pill_events_date_idx on pill_events(scheduled_date);
create index if not exists pill_events_status_idx on pill_events(status);
create index if not exists pill_events_treatment_idx on pill_events(treatment_id);
create unique index if not exists pill_events_unique_slot
  on pill_events(treatment_id, scheduled_date, scheduled_time);

create trigger pill_events_set_updated_at
  before update on pill_events
  for each row execute function pill_set_updated_at();

-- ============================================================
-- 5) LOGS (auditoría de cambios de estado de cada toma)
-- ============================================================
create table if not exists pill_logs (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid references pill_events(id) on delete set null,
  action      text not null,                  -- ej: 'tomada', 'pospuesta_10', 'omitida'
  old_status  pill_event_status,
  new_status  pill_event_status,
  created_at  timestamptz not null default now()
);

create index if not exists pill_logs_event_idx on pill_logs(event_id);
