import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  format,
  parseISO,
} from "date-fns";
import { supabase } from "@/lib/supabase/client";
import type { IsoWeekday, PillEvent, Treatment } from "@/features/pill/types";

type ScheduleSlot = { day_of_week: IsoWeekday; time_of_day: string };

type TreatmentForGen = Pick<
  Treatment,
  | "id"
  | "medication_id"
  | "start_date"
  | "duration_value"
  | "duration_unit"
  | "end_date"
  | "quantity_per_dose"
>;

// Fecha de fin efectiva: end_date explícita, o calculada desde la duración.
export function computeEndDate(t: TreatmentForGen): Date {
  if (t.end_date) return parseISO(t.end_date);
  const start = parseISO(t.start_date);
  if (t.duration_value && t.duration_value > 0 && t.duration_unit) {
    if (t.duration_unit === "days") return addDays(start, t.duration_value - 1);
    if (t.duration_unit === "weeks") return addDays(addWeeks(start, t.duration_value), -1);
    if (t.duration_unit === "months") return addDays(addMonths(start, t.duration_value), -1);
  }
  return start;
}

function isoWeekday(d: Date): IsoWeekday {
  const g = d.getDay(); // 0=domingo ... 6=sábado
  return (g === 0 ? 7 : g) as IsoWeekday;
}

// Construye (sin tocar la base) todas las tomas concretas del tratamiento.
export function buildEvents(
  t: TreatmentForGen,
  schedules: ScheduleSlot[]
): Partial<PillEvent>[] {
  const start = parseISO(t.start_date);
  const end = computeEndDate(t);
  if (end < start || schedules.length === 0) return [];

  const timesByDay = new Map<IsoWeekday, string[]>();
  for (const s of schedules) {
    const arr = timesByDay.get(s.day_of_week) ?? [];
    arr.push(s.time_of_day);
    timesByDay.set(s.day_of_week, arr);
  }

  const events: Partial<PillEvent>[] = [];
  for (const day of eachDayOfInterval({ start, end })) {
    const times = timesByDay.get(isoWeekday(day));
    if (!times) continue;
    for (const time of times) {
      events.push({
        treatment_id: t.id,
        medication_id: t.medication_id,
        scheduled_date: format(day, "yyyy-MM-dd"),
        scheduled_time: time,
        quantity: t.quantity_per_dose,
        status: "pendiente",
      });
    }
  }
  return events;
}

// Sincroniza los eventos del tratamiento con su programación actual.
// Borra solo las tomas pendientes (preserva el historial ya marcado) y
// vuelve a insertar las tomas del calendario. Devuelve cuántas generó.
export async function syncTreatmentEvents(
  t: TreatmentForGen,
  schedules: ScheduleSlot[]
): Promise<number> {
  const { error: delError } = await supabase
    .from("pill_events")
    .delete()
    .eq("treatment_id", t.id)
    .eq("status", "pendiente");
  if (delError) throw delError;

  const events = buildEvents(t, schedules);
  for (let i = 0; i < events.length; i += 500) {
    const chunk = events.slice(i, i + 500);
    const { error } = await supabase.from("pill_events").upsert(chunk, {
      onConflict: "treatment_id,scheduled_date,scheduled_time",
      ignoreDuplicates: true,
    });
    if (error) throw error;
  }
  return events.length;
}
