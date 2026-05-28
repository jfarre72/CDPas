import type { EventStatus, Medication } from "@/features/pill/types";

// Etiqueta principal del medicamento.
// - con dosis: "Prednisona 1 mg"
// - por unidad: "Vitamina C"
export function doseLabel(
  med: Pick<Medication, "name" | "dose" | "unit">
): string {
  const parts = [med.name];
  if (med.dose != null) {
    parts.push(String(med.dose));
    if (med.unit) parts.push(med.unit);
  }
  return parts.join(" ");
}

// Palabra para contar las unidades de una toma (ej: "comprimido").
export function unitWord(med: Pick<Medication, "unit">): string {
  return med.unit?.trim() || "u.";
}

// "08:00:00" -> "08:00"
export function shortTime(time: string): string {
  return time.slice(0, 5);
}

export const STATUS_META: Record<
  EventStatus,
  { label: string; badge: "default" | "success" | "warning" | "muted" }
> = {
  pendiente: { label: "Pendiente", badge: "default" },
  tomada: { label: "Tomada", badge: "success" },
  omitida: { label: "Omitida", badge: "muted" },
};
