/**
 * Módulo: Usuarios / Datos (Supabase)
 * ------------------------------------------------------------------
 * Este archivo es el único punto de contacto del sistema con Supabase
 * (PostgreSQL + Auth + Storage), tal como lo define la Arquitectura
 * de Software v2 ("ningún componente de la capa de Presentación accede
 * directamente a la base de datos... todo pasa por la capa de Lógica
 * de Negocio").
 *
 * Ahora mismo NO hay credenciales reales configuradas: falta crear el
 * archivo .env.local (ver .env.example) con las llaves del proyecto de
 * Supabase. Mientras tanto, todas las páginas del prototipo usan datos
 * de ejemplo en src/data/*.ts en vez de consultar esta función.
 *
 * Para conectar Supabase de verdad:
 *   1. npm install @supabase/supabase-js
 *   2. Completa NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local
 *   3. Reemplaza los arrays de src/data/*.ts por llamadas a getSupabaseClient()
 */
export function getSupabaseClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local — " +
        "todavía no hay conexión real a Supabase, ver src/lib/supabaseClient.ts"
    );
  }

  // Descomenta cuando instales @supabase/supabase-js:
  // import { createClient } from "@supabase/supabase-js";
  // return createClient(url, anonKey);

  throw new Error("@supabase/supabase-js no está instalado todavía.");
}
