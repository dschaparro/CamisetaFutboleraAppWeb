/**
 * ATAJO TEMPORAL DE DESARROLLO — saltarse el login del panel.
 *
 * Se activa SOLO si se cumplen las dos condiciones:
 *   1. NODE_ENV no es "production" (o sea, `npm run dev`; nunca en build/Vercel).
 *   2. .env.local contiene DEV_BYPASS_AUTH=true
 *
 * Para volver al login real: borrar la línea DEV_BYPASS_AUTH de .env.local
 * (o ponerla en false) y reiniciar `npm run dev`. Eliminar este archivo y sus
 * usos en proxy.ts y app/api/auth/me/route.ts cuando la base de datos esté lista.
 */
export function isDevAuthBypass(): boolean {
  return process.env.NODE_ENV !== "production" && process.env.DEV_BYPASS_AUTH === "true";
}

export const DEV_BYPASS_USER = {
  id: "dev-bypass",
  email: "dev@localhost",
  nombre: "Admin (modo dev)",
  rol: "Administrador",
} as const;
