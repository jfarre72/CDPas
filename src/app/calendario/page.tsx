"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  addDays,
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EventCard } from "@/components/event-card";
import { listEventsBetween } from "@/features/pill/services/events";
import { doseLabel, shortTime } from "@/features/pill/format";
import type { PillEventWithMedication } from "@/features/pill/types";

type ViewMode = "dia" | "semana" | "mes";
const WEEK_OPTS = { weekStartsOn: 1 as const, locale: es };
const WEEKDAY_HEADERS = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];

export default function CalendarPage() {
  const [mode, setMode] = useState<ViewMode>("mes");
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

  const byDate = useMemo(() => groupByDate(events), [events]);

  function move(dir: 1 | -1) {
    if (mode === "dia") setCursor((c) => addDays(c, dir));
    if (mode === "semana") setCursor((c) => addWeeks(c, dir));
    if (mode === "mes") setCursor((c) => addMonths(c, dir));
  }

  function openDay(day: Date) {
    setCursor(day);
    setMode("dia");
  }

  return (
    <div className="space-y-4">
      <p className="text-sm font-medium capitalize text-muted-foreground">
        {rangeLabel(mode, cursor)}
      </p>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-lg border p-0.5">
          {(["dia", "semana", "mes"] as ViewMode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={
                "rounded-md px-3 py-1 text-sm font-medium capitalize transition-colors " +
                (mode === m ? "bg-primary text-primary-foreground" : "text-muted-foreground")
              }
            >
              {m === "dia" ? "Día" : m}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => move(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={() => setCursor(new Date())}>
            Hoy
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => move(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={load} disabled={loading}>
            <RefreshCw className={"h-4 w-4 " + (loading ? "animate-spin" : "")} />
          </Button>
        </div>
      </div>

      {mode === "mes" && <MonthGrid cursor={cursor} byDate={byDate} onOpenDay={openDay} />}
      {mode === "semana" && <WeekGrid cursor={cursor} byDate={byDate} onOpenDay={openDay} />}
      {mode === "dia" && <DayView cursor={cursor} byDate={byDate} loading={loading} onChanged={load} />}
    </div>
  );
}

function EventChip({ ev }: { ev: PillEventWithMedication }) {
  const done = ev.status === "tomada";
  const skipped = ev.status === "omitida";
  return (
    <div
      className={
        "flex items-center gap-1 truncate rounded px-1 py-0.5 text-[11px] leading-tight " +
        (skipped ? "opacity-50 line-through " : "") +
        (done ? "bg-emerald-50 " : "bg-muted/60 ")
      }
      title={`${shortTime(ev.scheduled_time)} ${doseLabel(ev.medication)}`}
    >
      <span
        className="h-2 w-2 shrink-0 rounded-full"
        style={{ backgroundColor: ev.medication.color }}
      />
      <span className="shrink-0 tabular-nums text-muted-foreground">
        {shortTime(ev.scheduled_time)}
      </span>
      <span className="truncate">{ev.medication.name}</span>
    </div>
  );
}

function MonthGrid({
  cursor,
  byDate,
  onOpenDay,
}: {
  cursor: Date;
  byDate: Map<string, PillEventWithMedication[]>;
  onOpenDay: (d: Date) => void;
}) {
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(cursor), WEEK_OPTS),
    end: endOfWeek(endOfMonth(cursor), WEEK_OPTS),
  });

  return (
    <div className="overflow-hidden rounded-xl border">
      <div className="grid grid-cols-7 border-b bg-muted/40 text-center text-[10px] font-semibold text-muted-foreground sm:text-xs">
        {WEEKDAY_HEADERS.map((d) => (
          <div key={d} className="py-1.5">{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayEvents = byDate.get(key) ?? [];
          const outside = !isSameMonth(day, cursor);
          return (
            <button
              key={key}
              onClick={() => onOpenDay(day)}
              className={
                "min-h-[64px] border-b border-r p-1 text-left align-top transition-colors hover:bg-accent/50 sm:min-h-[96px] " +
                (outside ? "bg-muted/20 text-muted-foreground" : "")
              }
            >
              <span
                className={
                  "inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] sm:text-xs " +
                  (isToday(day) ? "bg-primary font-semibold text-primary-foreground" : "")
                }
              >
                {format(day, "d")}
              </span>
              <div className="mt-0.5 space-y-0.5">
                {/* En mobile mostramos puntos; en sm+ chips con texto */}
                <div className="flex flex-wrap gap-0.5 sm:hidden">
                  {dayEvents.slice(0, 4).map((ev) => (
                    <span
                      key={ev.id}
                      className="h-1.5 w-1.5 rounded-full"
                      style={{ backgroundColor: ev.medication.color }}
                    />
                  ))}
                </div>
                <div className="hidden space-y-0.5 sm:block">
                  {dayEvents.slice(0, 3).map((ev) => (
                    <EventChip key={ev.id} ev={ev} />
                  ))}
                  {dayEvents.length > 3 && (
                    <p className="px-1 text-[10px] text-muted-foreground">
                      +{dayEvents.length - 3} más
                    </p>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function WeekGrid({
  cursor,
  byDate,
  onOpenDay,
}: {
  cursor: Date;
  byDate: Map<string, PillEventWithMedication[]>;
  onOpenDay: (d: Date) => void;
}) {
  const days = eachDayOfInterval({
    start: startOfWeek(cursor, WEEK_OPTS),
    end: endOfWeek(cursor, WEEK_OPTS),
  });

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
      {days.map((day) => {
        const key = format(day, "yyyy-MM-dd");
        const dayEvents = byDate.get(key) ?? [];
        return (
          <button
            key={key}
            onClick={() => onOpenDay(day)}
            className="flex min-h-[110px] flex-col rounded-xl border p-2 text-left transition-colors hover:bg-accent/50"
          >
            <div className="mb-1 flex items-center gap-1.5">
              <span
                className={
                  "inline-flex h-6 w-6 items-center justify-center rounded-full text-xs " +
                  (isToday(day) ? "bg-primary font-semibold text-primary-foreground" : "font-medium")
                }
              >
                {format(day, "d")}
              </span>
              <span className="text-xs capitalize text-muted-foreground">
                {format(day, "EEE", { locale: es })}
              </span>
            </div>
            <div className="space-y-0.5">
              {dayEvents.map((ev) => (
                <EventChip key={ev.id} ev={ev} />
              ))}
            </div>
          </button>
        );
      })}
    </div>
  );
}

function DayView({
  cursor,
  byDate,
  loading,
  onChanged,
}: {
  cursor: Date;
  byDate: Map<string, PillEventWithMedication[]>;
  loading: boolean;
  onChanged: () => void;
}) {
  const key = format(cursor, "yyyy-MM-dd");
  const dayEvents = (byDate.get(key) ?? [])
    .slice()
    .sort((a, b) => a.scheduled_time.localeCompare(b.scheduled_time));

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold capitalize">
        {format(cursor, "EEEE d 'de' MMMM", { locale: es })}
      </h3>
      {loading && <p className="text-sm text-muted-foreground">Cargando…</p>}
      {!loading && dayEvents.length === 0 && (
        <div className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
          No hay tomas este día.
        </div>
      )}
      <div className="space-y-2">
        {dayEvents.map((ev) => (
          <EventCard key={ev.id} event={ev} onChanged={onChanged} />
        ))}
      </div>
    </div>
  );
}

function getRange(mode: ViewMode, cursor: Date) {
  if (mode === "dia") return { from: cursor, to: cursor };
  if (mode === "semana")
    return { from: startOfWeek(cursor, WEEK_OPTS), to: endOfWeek(cursor, WEEK_OPTS) };
  // mes: incluir días visibles de meses adyacentes en la grilla
  return {
    from: startOfWeek(startOfMonth(cursor), WEEK_OPTS),
    to: endOfWeek(endOfMonth(cursor), WEEK_OPTS),
  };
}

function rangeLabel(mode: ViewMode, cursor: Date) {
  if (mode === "dia") return format(cursor, "EEEE d 'de' MMMM yyyy", { locale: es });
  if (mode === "semana") {
    const from = startOfWeek(cursor, WEEK_OPTS);
    const to = endOfWeek(cursor, WEEK_OPTS);
    return `${format(from, "d MMM", { locale: es })} – ${format(to, "d MMM yyyy", { locale: es })}`;
  }
  return format(cursor, "MMMM yyyy", { locale: es });
}

function groupByDate(events: PillEventWithMedication[]): Map<string, PillEventWithMedication[]> {
  const map = new Map<string, PillEventWithMedication[]>();
  for (const ev of events) {
    const arr = map.get(ev.scheduled_date) ?? [];
    arr.push(ev);
    map.set(ev.scheduled_date, arr);
  }
  return map;
}
