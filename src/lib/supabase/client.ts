import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/features/pill/types";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !anonKey) {
  throw new Error(
    "Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (ver .env.local.example)"
  );
}

// Single-user: sin sesión persistida. Cliente de navegador para el módulo.
export const supabase = createClient<Database>(url, anonKey, {
  auth: { persistSession: false },
});
