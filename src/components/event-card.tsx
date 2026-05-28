"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Clock, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { postponeEvent, setEventStatus } from "@/features/pill/services/events";
import { STATUS_META, doseLabel, shortTime, unitWord } from "@/features/pill/format";
import type { EventStatus, PillEventWithMedication } from "@/features/pill/types";

interface Props {
  event: PillEventWithMedication;
  onChanged?: () => void;
}

export function EventCard({ event, onChanged }: Props) {
  const [status, setStatus] = useState<EventStatus>(event.status);
  const [busy, setBusy] = useState(false);
  const meta = STATUS_META[status];

  async function apply(action: () => Promise<void>, next: EventStatus) {
    setBusy(true);
    try {
      await action();
      setStatus(next);
      onChanged?.();
    } catch (err) {
      console.error(err);
      alert("No se pudo guardar la acción. Reintentá.");
    } finally {
      setBusy(false);
    }
  }

  const actionable = status === "pendiente" || status === "pospuesta";

  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-3">
        <div
          className="w-1.5 shrink-0 self-stretch"
          style={{ backgroundColor: event.medication.color }}
          aria-hidden
        />
        <div className="min-w-0 flex-1 py-2">
          <Link
            href={`/medicamentos/${event.medication_id}/tratamiento`}
            className="block truncate text-sm font-semibold hover:underline"
          >
            {doseLabel(event.medication)}
          </Link>
          <p className="text-xs text-muted-foreground">
            {shortTime(event.scheduled_time)} · {event.quantity} {unitWord(event.medication)}
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 pr-3">
          {actionable ? (
            <>
              <Button
                size="sm"
                disabled={busy}
                onClick={() => apply(() => setEventStatus(event.id, "tomada"), "tomada")}
              >
                <Check className="h-4 w-4" />
                <span className="hidden sm:inline">Tomada</span>
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="h-9 w-9"
                disabled={busy}
                title="Posponer 10 minutos"
                aria-label="Posponer 10 minutos"
                onClick={() => apply(() => postponeEvent(event.id, 10), "pospuesta")}
              >
                <Clock className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-9 w-9"
                disabled={busy}
                title="Omitir"
                aria-label="Omitir"
                onClick={() => apply(() => setEventStatus(event.id, "omitida"), "omitida")}
              >
                <X className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Badge variant={meta.badge}>{meta.label}</Badge>
          )}
        </div>
      </div>
    </Card>
  );
}
