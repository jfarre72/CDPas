"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addMonths,
  addWeeks,
  endOfMonth,
  endOfWeek,
  format,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EventCard } from "@/components/event-card";
import { listEventsBetween } from "@/features/pill/services/events";
import { STATUS_META, doseLabel, shortTime } from "@/features/pill/format";
import type { PillEventWithMedication } from "@/features/pill/types";

type ViewMode = "dia" | "semana" | "mes";
const WEEK_OPTS = { weekStartsOn: 1 as const, locale: es };

export default function CalendarPage() {
  const [mode, setMode] = useState<ViewMode>("semana");
  const [cursor, setCursor] = useState(new Date());
  const [events, setEvents] = useState<PillEventWithMedication[]>([]);
  const [loading, setLoading] = useState(true);

  const range = useMemo(() => getRange(mode, cursor), [mode, cursor]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setEvents(
        await listEventsBetween(
          format(range.from, "yyyy-MM-dd"),
          format(range.to, "yyyy-MM-dd")
        )
      );
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    load();
  }, [load]);

  function move(dir: 1 | -1) {
    if (mode === "dia") setCursor((c) => new Date(c.getTime() + dir * 86_400_000));
    if (mode === "semana") setCursor((c) => addWeeks(c, dir));
    if (mode === "mes") setCursor((c) => addMonths(c, dir));
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex rounded-xl border p-1">
          {(["dia", "semana", "mes"] as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={
                "rounded-lg px-4 py-1.5 text-sm font-medium capitalize transition-colors " +
                (mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground")
              }
            >
              {m === "dia" ? "Hoy" : m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => move(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="min-w-[160px] text-center text-sm font-medium capitalize">
            {rangeLabel(mode, cursor)}
          </span>
          <Button variant="outline" size="icon" onClick={() => move(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {loading && <p className="text-muted-foreground">Cargando…</p>}
      {!loading && events.length === 0 && (
        <div className="rounded-2xl border border-dashed p-8 text-center text-muted-foreground">
          No hay tomas en este período.
        </div>
      )}

      {!loading && mode === "mes" && <MonthGrid events={events} />}
      {!loading && mode !== "mes" && <DayList events={events} onChanged={load} />}
    </div>
  );
}

function DayList({
  events,
  onChanged,
}: {
  events: PillEventWithMedication[];
  onChanged: () => void;
}) {
  const byDate = groupBy(events, (e) => e.scheduled_date);
  return (
    <div className="space-y-6">
      {[...byDate.entries()].map(([date, items]) => (
        <section key={date} className="space-y-3">
          <h3 className="text-sm font-semibold capitalize text-muted-foreground">
            {format(new Date(date + "T00:00:00"), "EEEE d 'de' MMMM", { locale: es })}
          </h3>
          <div className="space-y-3">
            {items.map((ev) => (
              <EventCard key={ev.id} event={ev} onChanged={onChanged} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function MonthGrid({ events }: { events: PillEventWithMedication[] }) {
  const byDate = groupBy(events, (e) => e.scheduled_date);
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {[...byDate.entries()].map(([date, items]) => (
        <Card key={date}>
          <CardContent className="p-4">
            <p className="mb-2 text-sm font-semibold capitalize">
              {format(new Date(date + "T00:00:00"), "EEE d MMM", { locale: es })}
            </p>
            <ul className="space-y-1.5">
              {items.map((ev) => (
                <li key={ev.id} className="flex items-center gap-2 text-sm">
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: ev.medication.color }}
                  />
                  <span className="text-muted-foreground">{shortTime(ev.scheduled_time)}</span>
                  <span className="truncate">{doseLabel(ev.medication)}</span>
                  <Badge variant={STATUS_META[ev.status].badge} className="ml-auto shrink-0">
                    {STATUS_META[ev.status].label}
                  </Badge>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function getRange(mode: ViewMode, cursor: Date) {
  if (mode === "dia") return { from: cursor, to: cursor };
  if (mode === "semana")
    return { from: startOfWeek(cursor, WEEK_OPTS), to: endOfWeek(cursor, WEEK_OPTS) };
  return { from: startOfMonth(cursor), to: endOfMonth(cursor) };
}

function rangeLabel(mode: ViewMode, cursor: Date) {
  if (mode === "dia") return format(cursor, "d 'de' MMM", { locale: es });
  if (mode === "semana") {
    const from = startOfWeek(cursor, WEEK_OPTS);
    const to = endOfWeek(cursor, WEEK_OPTS);
    return `${format(from, "d MMM", { locale: es })} – ${format(to, "d MMM", { locale: es })}`;
  }
  return format(cursor, "MMMM yyyy", { locale: es });
}

function groupBy<T>(items: T[], key: (x: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const it of items) {
    const k = key(it);
    const arr = map.get(k) ?? [];
    arr.push(it);
    map.set(k, arr);
  }
  return map;
}
