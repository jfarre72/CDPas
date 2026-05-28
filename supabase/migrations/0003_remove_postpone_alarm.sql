-- ============================================================
-- 0003 · Quitar soporte de posponer y alarma/notificación
-- Aditivo/limpieza. Seguro de correr una sola vez.
-- ============================================================

-- Las tomas que estaban "pospuesta" pasan a "pendiente".
update pill_events set status = 'pendiente' where status = 'pospuesta';

-- Columnas que ya no se usan.
alter table pill_events    drop column if exists postponed_until;
alter table pill_treatments drop column if exists alarm_enabled;

-- Nota: el valor 'pospuesta' del enum pill_event_status se deja como está
-- (Postgres no permite quitar un valor de enum de forma simple). Es inofensivo:
-- la app ya no lo genera ni lo usa.
