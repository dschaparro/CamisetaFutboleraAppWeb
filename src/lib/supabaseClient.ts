/** Solo servidor. Keys `sb_*` van en `apikey`, no en Authorization. */
export function getSupabaseConfig(): { url: string; secretKey: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL;
  const secretKey = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !secretKey) {
    throw new Error(
      "Faltan NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SECRET_KEY en .env.local",
    );
  }

  return { url: url.replace(/\/$/, ""), secretKey };
}
