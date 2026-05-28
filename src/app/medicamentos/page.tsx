"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, CalendarPlus, Plus, Trash2 } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MedicationForm } from "@/components/medication-form";
import { deleteMedication, listMedications } from "@/features/pill/services/medications";
import { listTreatments } from "@/features/pill/services/treatments";
import { doseLabel } from "@/features/pill/format";
import type { Medication } from "@/features/pill/types";

export default function MedicationsPage() {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [treatedIds, setTreatedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [medList, treatments] = await Promise.all([
        listMedications(true),
        listTreatments(),
      ]);
      setMeds(medList);
      setTreatedIds(new Set(treatments.map((t) => t.medication_id)));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleDelete(med: Medication) {
    const hasTreatment = treatedIds.has(med.id);
    const msg = hasTreatment
      ? `¿Eliminar "${doseLabel(med)}"? Se borrará también su tratamiento y todas las tomas del calendario.`
      : `¿Eliminar "${doseLabel(med)}"?`;
    if (!confirm(msg)) return;
    setDeletingId(med.id);
    try {
      await deleteMedication(med.id);
      await load();
    } catch (err) {
      console.error(err);
      alert("No se pudo eliminar el medicamento.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold sm:text-2xl">Medicamentos</h1>
        <Button size="sm" onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-4 w-4" /> Nuevo
        </Button>
      </div>

      <p className="text-xs text-muted-foreground sm:text-sm">
        Cada dosis es un medicamento aparte (ej: Prednisona 1 mg y 0,5 mg son distintos).
      </p>

      {showForm && (
        <MedicationForm
          onCreated={() => {
            setShowForm(false);
            load();
          }}
          onCancel={() => setShowForm(false)}
        />
      )}

      {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}

      {!loading && meds.length === 0 && !showForm && (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          Todavía no cargaste medicamentos.
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {meds.map((med) => (
          <Card key={med.id} className={med.active ? "" : "opacity-60"}>
            <CardContent className="p-4">
              <div className="flex items-start gap-2.5">
                <span
                  className="mt-1 h-3.5 w-3.5 shrink-0 rounded-full"
                  style={{ backgroundColor: med.color }}
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold">{doseLabel(med)}</p>
                  {med.notes && (
                    <p className="mt-0.5 text-xs text-muted-foreground">{med.notes}</p>
                  )}
                  <div className="mt-1.5 flex flex-wrap gap-1.5">
                    {treatedIds.has(med.id) && (
                      <Badge variant="success">Con tratamiento</Badge>
                    )}
                    {!med.active && <Badge variant="muted">Inactivo</Badge>}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                  disabled={deletingId === med.id}
                  onClick={() => handleDelete(med)}
                  aria-label="Eliminar medicamento"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Link
                href={`/medicamentos/${med.id}/tratamiento`}
                className={buttonVariants({ variant: "secondary", size: "sm", className: "mt-3 w-full" })}
              >
                {treatedIds.has(med.id) ? (
                  <>
                    <CalendarCheck className="h-4 w-4" /> Ver / editar tratamiento
                  </>
                ) : (
                  <>
                    <CalendarPlus className="h-4 w-4" /> Crear tratamiento
                  </>
                )}
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
