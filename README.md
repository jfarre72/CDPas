# Pastillero · DIFED

Módulo web de **pastillero / calendario de medicación**, aislado dentro del
proyecto DIFED. Permite cargar medicamentos, crear tratamientos con
días/horarios/duración y visualizar las tomas en un calendario.

> Single-user: sin login ni RLS. Pensado para una sola persona.

## Stack

- Next.js 14 (App Router) · React · TypeScript
- Tailwind CSS · shadcn/ui · lucide-react
- Supabase (PostgreSQL)
- Deploy: Vercel

## Aislamiento dentro de DIFED

Todas las tablas, tipos y funciones usan el prefijo `pill_`. La migración es
**100% aditiva**: no modifica ni referencia ninguna tabla existente de DIFED.

Tablas: `pill_medications`, `pill_treatments`, `pill_treatment_schedules`,
`pill_events`, `pill_logs`.

## Puesta en marcha

1. Correr la migración SQL en el SQL Editor de Supabase:
   `supabase/migrations/0001_pill_module.sql`
2. Copiar variables de entorno:
   ```bash
   cp .env.local.example .env.local
   # completar NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY
   ```
3. Instalar y correr:
   ```bash
   npm install
   npm run dev
   ```

## Estructura

```
src/
  app/                      # rutas (App Router)
    page.tsx                # pantalla "Hoy"
    calendario/             # vistas Hoy / Semana / Mes
    medicamentos/           # biblioteca + alta + creación de tratamiento
  components/               # UI (shadcn) + componentes del módulo
  features/pill/
    types.ts                # tipos del dominio
    format.ts               # helpers de presentación
    services/               # acceso a datos (Supabase)
  lib/
    supabase/client.ts      # cliente Supabase tipado
    utils.ts
```

Separación: **UI** (`app`/`components`) → **servicios** (`features/pill/services`)
→ **datos** (Supabase). Las páginas nunca consultan Supabase directamente.

## Pendiente (próximas etapas)

- Generación automática de eventos (`pill_events`) al crear un tratamiento.
- Notificaciones (Notification API + Service Worker) y alarma sonora.
