"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getMedication } from "@/features/pill/services/medications";
import { createTreatmentWithSchedules } from "@/features/pill/services/treatments";
import { doseLabel } from "@/features/pill/format";
import { WEEKDAYS, type DurationUnit, type IsoWeekday, type Medication } from "@/features/pill/types";

const UNIT_LABELS: Record<DurationUnit, string> = {
  days: "Días",
  weeks: "Semanas",
  months: "Meses",
};

export default function NewTreatmentPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [med, setMed] = useState<Medication | null>(null);

  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [durationValue, setDurationValue] = useState("8");
  const [durationUnit, setDurationUnit] = useState<DurationUnit>("weeks");
  const [endDate, setEndDate] = useState("");
  const [days, setDays] = useState<Set<IsoWeekday>>(new Set());
  const [times, setTimes] = useState<string[]>(["08:00"]);
  const [quantity, setQuantity] = useState("1");
  const [alarm, setAlarm] = useState(true);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getMedication(id).then(setMed).catch(console.error);
  }, [id]);

  function toggleDay(d: IsoWeekday) {
    setDays((prev) => {
      const next = new Set(prev);
      next.has(d) ? next.delete(d) : next.add(d);
      return next;
    });
  }

  function updateTime(i: number, value: string) {
    setTimes((prev) => prev.map((t, idx) => (idx === i ? value : t)));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (days.size === 0) {
      alert("Elegí al menos un día de la semana.");
      return;
    }
    const cleanTimes = times.filter(Boolean);
    if (cleanTimes.length === 0) {
      alert("Agregá al menos un horario.");
      return;
    }

    setBusy(true);
    try {
      const slots = [...days].flatMap((day) =>
        cleanTimes.map((time) => ({ day_of_week: day, time_of_day: time }))
      );
      await createTreatmentWithSchedules(
        {
          medication_id: id,
          start_date: startDate,
          duration_value: durationValue ? Number(durationValue) : null,
          duration_unit: durationUnit,
          end_date: endDate || null,
          quantity_per_dose: Number(quantity) || 1,
          alarm_enabled: alarm,
          notes: notes.trim() || null,
          active: true,
        },
        slots
      );
      // La generación de eventos del calendario se implementará más adelante.
      router.push("/calendario");
    } catch (err) {
      console.error(err);
      alert("No se pudo crear el tratamiento.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Nuevo tratamiento</h1>
        {med && <p className="text-muted-foreground">{doseLabel(med)}</p>}
      </div>

      <Card>
        <CardContent className="p-5">
          <form onSubmit={submit} className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="start">Fecha de inicio</Label>
                <Input id="start" type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="end">Fecha fin (opcional)</Label>
                <Input id="end" type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="dval">Duración</Label>
                <Input id="dval" type="number" min="1" value={durationValue} onChange={(e) => setDurationValue(e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <Label>Unidad</Label>
                <div className="inline-flex rounded-xl border p-1">
                  {(Object.keys(UNIT_LABELS) as DurationUnit[]).map((u) => (
                    <button
                      key={u}
                      type="button"
                      onClick={() => setDurationUnit(u)}
                      className={
                        "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors " +
                        (durationUnit === u ? "bg-primary text-primary-foreground" : "text-muted-foreground")
                      }
                    >
                      {UNIT_LABELS[u]}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Días de la semana</Label>
              <div className="flex flex-wrap gap-2">
                {WEEKDAYS.map((d) => (
                  <button
                    key={d.value}
                    type="button"
                    onClick={() => toggleDay(d.value)}
                    className={
                      "h-11 w-12 rounded-xl border text-sm font-medium transition-colors " +
                      (days.has(d.value)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "bg-card text-muted-foreground hover:bg-accent")
                    }
                  >
                    {d.short}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Horarios</Label>
              <div className="space-y-2">
                {times.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Input type="time" value={t} onChange={(e) => updateTime(i, e.target.value)} className="w-40" />
                    {times.length > 1 && (
                      <Button type="button" variant="ghost" size="icon" onClick={() => setTimes((p) => p.filter((_, idx) => idx !== i))}>
                        <X className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => setTimes((p) => [...p, "20:00"])}>
                <Plus className="h-4 w-4" /> Agregar horario
              </Button>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="qty">Cantidad por toma</Label>
              <Input id="qty" type="number" step="any" min="0" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="w-40" />
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={alarm} onChange={(e) => setAlarm(e.target.checked)} className="h-4 w-4" />
              Activar alarma / notificación
            </label>

            <div className="space-y-1.5">
              <Label htmlFor="tnotes">Observaciones</Label>
              <Textarea id="tnotes" value={notes} onChange={(e) => setNotes(e.target.value)} />
            </div>

            <div className="rounded-xl bg-accent p-3 text-sm text-accent-foreground">
              La generación automática del calendario de tomas se implementará en una próxima etapa.
            </div>

            <div className="flex gap-2">
              <Button type="submit" size="lg" disabled={busy}>
                Guardar tratamiento
              </Button>
              <Button type="button" variant="ghost" onClick={() => router.back()}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
