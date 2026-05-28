import { supabase } from "@/lib/supabase/client";
import type {
  EventStatus,
  PillEvent,
  PillEventWithMedication,
} from "@/features/pill/types";

const SELECT_WITH_MED =
  "*, medication:pill_medications(name, dose, unit, color)";

export async function listEventsBetween(
  fromDate: string,
  toDate: string
): Promise<PillEventWithMedication[]> {
  const { data, error } = await supabase
    .from("pill_events")
    .select(SELECT_WITH_MED)
    .gte("scheduled_date", fromDate)
    .lte("scheduled_date", toDate)
    .order("scheduled_date", { ascending: true })
    .order("scheduled_time", { ascending: true });
  if (error) throw error;
  return (data ?? []) as unknown as PillEventWithMedication[];
}

export async function listEventsForDate(
  date: string
): Promise<PillEventWithMedication[]> {
  return listEventsBetween(date, date);
}

interface UpdateStatusOptions {
  postponedUntil?: string | null;
  notes?: string | null;
}

export async function setEventStatus(
  eventId: string,
  status: EventStatus,
  options: UpdateStatusOptions = {}
): Promise<void> {
  const patch: Partial<PillEvent> = { status };
  if (status === "tomada") patch.taken_at = new Date().toISOString();
  if (status === "pospuesta") patch.postponed_until = options.postponedUntil ?? null;
  if (options.notes !== undefined) patch.notes = options.notes;

  const { error } = await supabase
    .from("pill_events")
    .update(patch)
    .eq("id", eventId);
  if (error) throw error;

  // Auditoría en pill_logs (best-effort, no bloquea la acción principal).
  await supabase.from("pill_logs").insert({ event_id: eventId, action: status, new_status: status });
}

// Posponer N minutos desde ahora.
export async function postponeEvent(eventId: string, minutes: number): Promise<void> {
  const until = new Date(Date.now() + minutes * 60_000).toISOString();
  return setEventStatus(eventId, "pospuesta", { postponedUntil: until });
}
