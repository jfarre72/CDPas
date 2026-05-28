"use client";

import { useCallback, useEffect, useState } from "react";
import { addDays, format, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/event-card";
import { listEventsForDate } from "@/features/pill/services/events";
import { shortTime } from "@/features/pill/format";
import type { PillEventWithMedication } from "@/features/pill/types";

export default function TodayPage() {
  const [cursor, setCursor] = useState(new Date());
  const [events, setEvents] = useState<PillEventWithMedication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const dateStr = format(cursor, "yyyy-MM-dd");
  const isToday = isSameDay(cursor, new Date());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEvents(await listEventsForDate(dateStr));
    } catch {
      setError("No se pudieron cargar las tomas.");
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  useEffect(() => {
    load();
  }, [load]);

  const byTime = groupByTime(events);
  const total = events.length;
  const taken = events.filter((e) => e.status === "tomada").length;

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="text-xs capitalize text-muted-foreground">
            {format(cursor, "EEEE d 'de' MMMM", { locale: es })}
          </p>
          <h1 className="text-xl font-bold sm:text-2xl">
            {isToday ? "Hoy tenés que tomar:" : "Tomas del día"}
          </h1>
          {total > 0 && (
            <p className="mt-0.5 text-sm font-medium text-primary">
              Tomaste {taken} de {total}
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCursor((c) => addDays(c, -1))} aria-label="Día anterior">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          {!isToday && (
            <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
              Hoy
            </Button>
          )}
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setCursor((c) => addDays(c, 1))} aria-label="Día siguiente">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}
      {error && <p className="text-sm text-destructive">{error}</p>}

      {!loading && !error && events.length === 0 && (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No hay tomas programadas para este día.
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
