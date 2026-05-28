"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CalendarCheck, CalendarPlus, Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { MedicationForm } from "@/components/medication-form";
import { listMedications } from "@/features/pill/services/medications";
import { listTreatments } from "@/features/pill/services/treatments";
import { doseLabel } from "@/features/pill/format";
import type { Medication } from "@/features/pill/types";

export default function MedicationsPage() {
  const [meds, setMeds] = useState<Medication[]>([]);
  const [treatedIds, setTreatedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Medicamentos</h1>
        <Button onClick={() => setShowForm((s) => !s)}>
          <Plus className="h-4 w-4" /> Nuevo
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
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

      {loading && <p className="text-muted-foreground">Cargando…</p>}

      {!loading && meds.length === 0 && !showForm && (
        <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          Todavía no cargaste medicamentos.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {meds.map((med) => (
          <Card key={med.id} className={med.active ? "" : "opacity-60"}>
            <CardContent className="p-5">
              <div className="flex items-start gap-3">
                <span
                  className="mt-1 h-4 w-4 shrink-0 rounded-full"
                  style={{ backgroundColor: med.color }}
                />
                <div className="flex-1">
                  <p className="font-semibold">{doseLabel(med)}</p>
                  {med.notes && (
                    <p className="mt-1 text-sm text-muted-foreground">{med.notes}</p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {treatedIds.has(med.id) && (
                      <Badge variant="success">Con tratamiento</Badge>
                    )}
                    {!med.active && <Badge variant="muted">Inactivo</Badge>}
                  </div>
                </div>
              </div>
              <Link
                href={`/medicamentos/${med.id}/tratamiento`}
                className={buttonVariants({ variant: "secondary", className: "mt-4 w-full" })}
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
