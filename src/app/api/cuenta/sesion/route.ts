import { NextResponse } from "next/server";
import { usarSimulacion } from "@/lib/modo-datos";
import { CUENTAS_DEMO, PASSWORD_DEMO } from "@/modules/identidad/infrastructure/simulacion";
import { sesionCliente } from "@/modules/identidad/infrastructure/sesiones";

/**
 * Para el encabezado de la tienda: nombre del cliente con sesión (o null).
 * En modo simulación también devuelve las cuentas de prueba para mostrarlas en /ingresar.
 */
export async function GET(request: Request) {
  const sesion = await sesionCliente(request);
  return NextResponse.json({
    cliente: sesion ? { nombre: sesion.nombre } : null,
    demo: usarSimulacion() ? { password: PASSWORD_DEMO, cuentas: CUENTAS_DEMO } : null,
  });
}
