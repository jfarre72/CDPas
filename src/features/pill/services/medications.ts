import { supabase } from "@/lib/supabase/client";
import type { Medication, NewMedication } from "@/features/pill/types";

export async function listMedications(includeInactive = false): Promise<Medication[]> {
  let query = supabase
    .from("pill_medications")
    .select("*")
    .order("name", { ascending: true });

  if (!includeInactive) query = query.eq("active", true);

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getMedication(id: string): Promise<Medication | null> {
  const { data, error } = await supabase
    .from("pill_medications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function createMedication(input: NewMedication): Promise<Medication> {
  const { data, error } = await supabase
    .from("pill_medications")
    .insert(input)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function updateMedication(
  id: string,
  patch: Partial<NewMedication>
): Promise<Medication> {
  const { data, error } = await supabase
    .from("pill_medications")
    .update(patch)
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  return data;
}

export async function deleteMedication(id: string): Promise<void> {
  const { error } = await supabase.from("pill_medications").delete().eq("id", id);
  if (error) throw error;
}
