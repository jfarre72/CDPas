"use client";

import { useCallback, useEffect, useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { EventCard } from "@/components/event-card";
import { listEventsForDate } from "@/features/pill/services/events";
import { shortTime } from "@/features/pill/format";
import type { PillEventWithMedication } from "@/features/pill/types";

export default function TodayPage() {
  const today = format(new Date(), "yyyy-MM-dd");
  const [events, setEvents] = useState<PillEventWithMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEvents(await listEventsForDate(today));
    } catch {
      setError("No se pudieron cargar las tomas de hoy.");
    } finally {
      setLoading(false);
    }
  }, [today]);

  useEffect(() => {
    load();
  }, [load]);

  const byTime = groupByTime(events);
  const pending = events.filter((e) => e.status === "pendiente").length;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div>
        <p className="text-xs capitalize text-muted-foreground">
          {format(new Date(), "EEEE d 'de' MMMM", { locale: es })}
        </p>
        <h1 className="text-xl font-bold sm:text-2xl">Hoy tenés que tomar:</h1>
        {pending > 0 && (
          <p className="mt-0.5 text-sm text-primary">
            {pending} {pending === 1 ? "toma pendiente" : "tomas pendientes"}
          </p>
        )}
      </div>

      {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && events.length === 0 && (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No hay tomas programadas para hoy.
        </div>
      )}

      {byTime.map(([time, items]) => (
        <section key={time} className="space-y-2">
          <h2 className="text-base font-semibold text-foreground">{shortTime(time)}</h2>
          <div className="space-y-2">
            {items.map((ev) => (
              <EventCard key={ev.id} event={ev} onChanged={load} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function groupByTime(
  events: PillEventWithMedication[]
): [string, PillEventWithMedication[]][] {
  const map = new Map<string, PillEventWithMedication[]>();
  for (const ev of events) {
    const arr = map.get(ev.scheduled_time) ?? [];
    arr.push(ev);
    map.set(ev.scheduled_time, arr);
  }
  return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
}
