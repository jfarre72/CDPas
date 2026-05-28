"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createMedication } from "@/features/pill/services/medications";
import type { MedicationKind } from "@/features/pill/types";

const PRESET_COLORS = [
  "#ef4444",
  "#f97316",
  "#eab308",
  "#22c55e",
  "#14b8a6",
  "#3b82f6",
  "#8b5cf6",
  "#ec4899",
];

interface Props {
  onCreated: () => void;
  onCancel: () => void;
}

export function MedicationForm({ onCreated, onCancel }: Props) {
  const [name, setName] = useState("");
  const [kind, setKind] = useState<MedicationKind>("dose");
  const [dose, setDose] = useState("");
  const [unit, setUnit] = useState("mg");
  const [color, setColor] = useState(PRESET_COLORS[5]);
  const [notes, setNotes] = useState("");
  const [active, setActive] = useState(true);
  const [busy, setBusy] = useState(false);

  function chooseKind(k: MedicationKind) {
    setKind(k);
    setUnit(k === "dose" ? "mg" : "comprimido");
    if (k === "unit") setDose("");
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await createMedication({
        name: name.trim(),
        kind,
        dose: kind === "dose" && dose ? Number(dose) : null,
        unit: unit.trim() || null,
        color,
        notes: notes.trim() || null,
        active,
      });
      onCreated();
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar el medicamento.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card>
      <CardContent className="p-5">
        <form onSubmit={submit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Tipo</Label>
            <div className="inline-flex rounded-xl border p-1">
              <button
                type="button"
                onClick={() => chooseKind("dose")}
                className={
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors " +
                  (kind === "dose" ? "bg-primary text-primary-foreground" : "text-muted-foreground")
                }
              >
                Con dosis
              </button>
              <button
                type="button"
                onClick={() => chooseKind("unit")}
                className={
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors " +
                  (kind === "unit" ? "bg-primary text-primary-foreground" : "text-muted-foreground")
                }
              >
                Por unidad
              </button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-1">
              <Label htmlFor="name">Nombre</Label>
              <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={kind === "dose" ? "Prednisona" : "Vitamina C"} required />
            </div>
            {kind === "dose" && (
              <div className="space-y-1.5">
                <Label htmlFor="dose">Dosis</Label>
                <Input id="dose" type="number" step="any" value={dose} onChange={(e) => setDose(e.target.value)} placeholder="1" />
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="unit">{kind === "dose" ? "Unidad" : "Forma"}</Label>
              <Input id="unit" value={unit} onChange={(e) => setUnit(e.target.value)} placeholder={kind === "dose" ? "mg" : "comprimido"} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Color identificatorio</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={
                    "h-8 w-8 rounded-full ring-offset-2 transition " +
                    (color === c ? "ring-2 ring-ring" : "")
                  }
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                />
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="notes">Observaciones</Label>
            <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="h-4 w-4" />
            Activo
          </label>

          <div className="flex gap-2">
            <Button type="submit" disabled={busy}>
              Guardar
            </Button>
            <Button type="button" variant="ghost" onClick={onCancel}>
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
