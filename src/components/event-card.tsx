"use client";

import { useState } from "react";
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

  return (
    <Card className="overflow-hidden">
      <div className="flex items-stretch">
        <div
          className="w-2 shrink-0"
          style={{ backgroundColor: event.medication.color }}
          aria-hidden
        />
        <div className="flex-1 p-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold">
                {doseLabel(event.medication)}
              </p>
              <p className="text-sm text-muted-foreground">
                {shortTime(event.scheduled_time)} · {event.quantity} {unitWord(event.medication)}
              </p>
            </div>
            <Badge variant={meta.badge}>{meta.label}</Badge>
          </div>

          {status === "pendiente" || status === "pospuesta" ? (
            <div className="mt-4 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <Button
                size="lg"
                disabled={busy}
                onClick={() => apply(() => setEventStatus(event.id, "tomada"), "tomada")}
              >
                <Check className="h-5 w-5" /> Tomada
              </Button>
              <Button
                size="lg"
                variant="secondary"
                disabled={busy}
                onClick={() => apply(() => postponeEvent(event.id, 10), "pospuesta")}
              >
                <Clock className="h-5 w-5" /> +10 min
              </Button>
              <Button
                size="lg"
                variant="outline"
                disabled={busy}
                onClick={() => apply(() => setEventStatus(event.id, "omitida"), "omitida")}
              >
                <X className="h-5 w-5" /> Omitir
              </Button>
            </div>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
