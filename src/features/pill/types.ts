// Tipos del dominio del módulo Pastillero.
// Aislados bajo el prefijo pill_.

export type DurationUnit = "days" | "weeks" | "months";

export type EventStatus = "pendiente" | "tomada" | "omitida";

// "dose": medicamento con dosis (ej: Prednisona 1 mg)
// "unit": medicamento por unidad (ej: 1 comprimido de Vitamina C)
export type MedicationKind = "dose" | "unit";

// day_of_week ISO: 1=lunes ... 7=domingo
export type IsoWeekday = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type Medication = {
  id: string;
  name: string;
  kind: MedicationKind;
  dose: number | null;
  unit: string | null;
  color: string;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type Treatment = {
  id: string;
  medication_id: string;
  start_date: string;
  duration_value: number | null;
  duration_unit: DurationUnit | null;
  end_date: string | null;
  quantity_per_dose: number;
  notes: string | null;
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type TreatmentSchedule = {
  id: string;
  treatment_id: string;
  day_of_week: IsoWeekday;
  time_of_day: string; // "HH:MM" / "HH:MM:SS"
  created_at: string;
};

export type PillEvent = {
  id: string;
  treatment_id: string;
  medication_id: string;
  scheduled_date: string;
  scheduled_time: string;
  quantity: number;
  status: EventStatus;
  taken_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
};

// Evento enriquecido con datos del medicamento, para las vistas.
export type PillEventWithMedication = PillEvent & {
  medication: Pick<Medication, "name" | "dose" | "unit" | "color">;
};

// Tipos de inserción (sin columnas autogeneradas).
export type NewMedication = Omit<
  Medication,
  "id" | "created_at" | "updated_at"
>;
export type NewTreatment = Omit<
  Treatment,
  "id" | "created_at" | "updated_at"
>;
export type NewSchedule = Omit<TreatmentSchedule, "id" | "created_at">;

// Esquema mínimo para el cliente tipado de Supabase.
export interface Database {
  public: {
    Tables: {
      pill_medications: {
        Row: Medication;
        Insert: NewMedication;
        Update: Partial<NewMedication>;
        Relationships: [];
      };
      pill_treatments: {
        Row: Treatment;
        Insert: NewTreatment;
        Update: Partial<NewTreatment>;
        Relationships: [];
      };
      pill_treatment_schedules: {
        Row: TreatmentSchedule;
        Insert: NewSchedule;
        Update: Partial<NewSchedule>;
        Relationships: [];
      };
      pill_events: {
        Row: PillEvent;
        Insert: Partial<PillEvent>;
        Update: Partial<PillEvent>;
        Relationships: [];
      };
      pill_logs: {
        Row: {
          id: string;
          event_id: string | null;
          action: string;
          old_status: EventStatus | null;
          new_status: EventStatus | null;
          created_at: string;
        };
        Insert: {
          event_id?: string | null;
          action: string;
          old_status?: EventStatus | null;
          new_status?: EventStatus | null;
        };
        Update: {
          event_id?: string | null;
          action?: string;
          old_status?: EventStatus | null;
          new_status?: EventStatus | null;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      pill_duration_unit: DurationUnit;
      pill_event_status: EventStatus;
      pill_medication_kind: MedicationKind;
    };
    CompositeTypes: Record<string, never>;
  };
}

export const WEEKDAYS: { value: IsoWeekday; label: string; short: string }[] = [
  { value: 1, label: "Lunes", short: "Lun" },
  { value: 2, label: "Martes", short: "Mar" },
  { value: 3, label: "Miércoles", short: "Mié" },
  { value: 4, label: "Jueves", short: "Jue" },
  { value: 5, label: "Viernes", short: "Vie" },
  { value: 6, label: "Sábado", short: "Sáb" },
  { value: 7, label: "Domingo", short: "Dom" },
];
