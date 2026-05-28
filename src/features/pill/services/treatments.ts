import { supabase } from "@/lib/supabase/client";
import type {
  NewSchedule,
  NewTreatment,
  Treatment,
  TreatmentSchedule,
} from "@/features/pill/types";

export async function listTreatments(): Promise<Treatment[]> {
  const { data, error } = await supabase
    .from("pill_treatments")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export async function getSchedules(treatmentId: string): Promise<TreatmentSchedule[]> {
  const { data, error } = await supabase
    .from("pill_treatment_schedules")
    .select("*")
    .eq("treatment_id", treatmentId)
    .order("day_of_week", { ascending: true });
  if (error) throw error;
  return data ?? [];
}

// Crea el tratamiento junto con sus combinaciones (día × horario).
// La generación de eventos (pill_events) se implementará más adelante.
export async function createTreatmentWithSchedules(
  treatment: NewTreatment,
  slots: { day_of_week: NewSchedule["day_of_week"]; time_of_day: string }[]
): Promise<Treatment> {
  const { data: created, error } = await supabase
    .from("pill_treatments")
    .insert(treatment)
    .select("*")
    .single();
  if (error) throw error;

  if (slots.length > 0) {
    const rows: NewSchedule[] = slots.map((s) => ({
      treatment_id: created.id,
      day_of_week: s.day_of_week,
      time_of_day: s.time_of_day,
    }));
    const { error: schedError } = await supabase
      .from("pill_treatment_schedules")
      .insert(rows);
    if (schedError) throw schedError;
  }

  return created;
}

export async function deleteTreatment(id: string): Promise<void> {
  const { error } = await supabase.from("pill_treatments").delete().eq("id", id);
  if (error) throw error;
}
