import { getSupabaseConfig } from "@/lib/supabaseClient";
import { toUsuario, type UsuarioRow } from "@/modules/identidad/infrastructure/usuarios-row";
import type { UsuarioConHash } from "@/modules/identidad/domain/types";

export async function findUsuarioByEmail(email: string): Promise<UsuarioConHash | null> {
  const { url, secretKey } = getSupabaseConfig();
  const endpoint = new URL("/rest/v1/usuarios", url);
  endpoint.searchParams.set("select", "id,email,nombre,rol,password_hash,activo");
  endpoint.searchParams.set("email", `eq.${email}`);
  endpoint.searchParams.set("limit", "1");

  let response: Response;
  try {
    response = await fetch(endpoint, {
      headers: {
        apikey: secretKey,
        Accept: "application/json",
      },
    });
  } catch (err) {
    const cause = err instanceof Error && "cause" in err && err.cause instanceof Error ? err.cause.message : "";
    const base = err instanceof Error ? err.message : "fetch failed";
    throw new Error(cause ? `${base} (${cause})` : base);
  }

  if (!response.ok) {
    const detail = (await response.text()).slice(0, 240);
    throw new Error(`Supabase HTTP ${response.status}: ${detail || response.statusText}`);
  }

  const rows = (await response.json()) as unknown;
  if (!Array.isArray(rows) || rows.length === 0) return null;
  return toUsuario(rows[0] as UsuarioRow);
}
