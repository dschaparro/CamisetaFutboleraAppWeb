import { NextResponse } from "next/server";
import { PendienteDeBaseDeDatosError } from "@/lib/modo-datos";
import { errorJson } from "@/modules/identidad/infrastructure/sesiones";
import { NoExisteError } from "@/modules/tienda/application/tienda";
import { CuponInvalidoError, DatosInvalidosError } from "@/modules/tienda/domain/reglas";

/** Ejecuta una acción de la tienda y traduce los errores de dominio a HTTP. */
export async function responder(accion: () => unknown | Promise<unknown>): Promise<NextResponse> {
  try {
    return NextResponse.json((await accion()) ?? { ok: true });
  } catch (err) {
    if (err instanceof DatosInvalidosError) return errorJson(400, "VALIDATION_ERROR", err.message, err.campos);
    if (err instanceof CuponInvalidoError) return errorJson(400, "CUPON_INVALIDO", err.message, { cupon: err.message });
    if (err instanceof NoExisteError) return errorJson(404, "NOT_FOUND", err.message);
    if (err instanceof PendienteDeBaseDeDatosError) return errorJson(503, "PENDIENTE_BD", err.message);
    throw err;
  }
}

export async function leerJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new DatosInvalidosError({ cuerpo: "Cuerpo JSON inválido" });
  }
}

const TIPOS: Record<string, (b: Buffer) => boolean> = {
  "image/png": (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  "image/jpeg": (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  "image/webp": (b) => b.subarray(0, 4).toString("ascii") === "RIFF" && b.subarray(8, 12).toString("ascii") === "WEBP",
};
export const MAX_IMAGEN_BYTES = 2 * 1024 * 1024;

/** Valida una imagen subida por tipo declarado, tamaño y firma real del archivo. */
export async function leerImagen(archivo: unknown): Promise<{ tipo: string; datos: Buffer }> {
  if (!(archivo instanceof File)) throw new DatosInvalidosError({ archivo: "Elige una imagen" });
  if (archivo.size > MAX_IMAGEN_BYTES) throw new DatosInvalidosError({ archivo: "La imagen pesa más de 2 MB" });
  const datos = Buffer.from(await archivo.arrayBuffer());
  const comprobar = TIPOS[archivo.type];
  if (!comprobar || !comprobar(datos)) throw new DatosInvalidosError({ archivo: "Formato no válido: usa JPG, PNG o WEBP" });
  return { tipo: archivo.type, datos };
}
