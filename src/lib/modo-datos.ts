/**
 * DATOS_SIMULADOS=true en .env.local: cuentas, clientes y pedidos viven en memoria
 * del servidor (datos de prueba, se reinician con `npm run dev`). Sirve para probar
 * cada rol mientras la base de datos no está lista. Con false o sin definir, se usa Supabase.
 */
export function usarSimulacion(): boolean {
  return process.env.DATOS_SIMULADOS === "true";
}

export class PendienteDeBaseDeDatosError extends Error {
  constructor(que: string) {
    super(`${que} todavía no está conectado a Supabase. Usa DATOS_SIMULADOS=true mientras tanto.`);
    this.name = "PendienteDeBaseDeDatosError";
  }
}
