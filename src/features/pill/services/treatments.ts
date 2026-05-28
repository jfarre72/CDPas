import { supabase } from "@/lib/supabase/client";
import { syncTreatmentEvents } from "@/features/pill/services/calendar";
import type {
  NewSchedule,
  NewTreatment,
  Treatment,
  TreatmentSchedule,
} from "@/features/pill/types";

type ScheduleSlot = { day_of_week: NewSchedule["day_of_week"]; time_of_day: string };

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

// Tratamiento (más reciente) de un medicamento, o null si no tiene.
export async function getTreatmentForMedication(
  medicationId: string
): Promise<Treatment | null> {
  const { data, error } = await supabase
    .from("pill_treatments")
    .select("*")
    .eq("medication_id", medicationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function replaceSchedules(treatmentId: string, slots: ScheduleSlot[]) {
  const { error: delError } = await supabase
    .from("pill_treatment_schedules")
    .delete()
    .eq("treatment_id", treatmentId);
  if (delError) throw delError;

  if (slots.length > 0) {
    const rows: NewSchedule[] = slots.map((s) => ({
      treatment_id: treatmentId,
      day_of_week: s.day_of_week,
      time_of_day: s.time_of_day,
    }));
    const { error } = await supabase.from("pill_treatment_schedules").insert(rows);
    if (error) throw error;
  }
}

// Crea el tratamiento, sus combinaciones (día × horario) y genera el calendario.
export async function createTreatmentWithSchedules(
  treatment: NewTreatment,
  slots: ScheduleSlot[]
): Promise<Treatment> {
  const { data: created, error } = await supabase
    .from("pill_treatments")
    .insert(treatment)
    .select("*")
    .single();
  if (error) throw error;

  await replaceSchedules(created.id, slots);
  await syncTreatmentEvents(created, slots);
  return created;
}

// Actualiza el tratamiento, reemplaza sus horarios y regenera el calendario.
export async function updateTreatmentWithSchedules(
  treatmentId: string,
  patch: Partial<NewTreatment>,
  slots: ScheduleSlot[]
): Promise<Treatment> {
  const { data: updated, error } = await supabase
    .from("pill_treatments")
    .update(patch)
    .eq("id", treatmentId)
    .select("*")
    .single();
  if (error) throw error;

  await replaceSchedules(treatmentId, slots);
  await syncTreatmentEvents(updated, slots);
  return updated;
}

export async function deleteTreatment(id: string): Promise<void> {
  const { error } = await supabase.from("pill_treatments").delete().eq("id", id);
  if (error) throw error;
}
