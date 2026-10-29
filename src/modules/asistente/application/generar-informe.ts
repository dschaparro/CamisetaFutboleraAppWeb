import { construirContexto } from "@/modules/asistente/domain/contexto";
import { SolicitudInvalidaError } from "@/modules/asistente/domain/errors";
import { validarInforme } from "@/modules/asistente/domain/informe";
import {
  MAX_SOLICITUD,
  MIN_SOLICITUD,
  SISTEMA,
  armarMensajeUsuario,
  sanearSolicitud,
} from "@/modules/asistente/domain/informe-prompt";
import type { Informe } from "@/modules/asistente/domain/informe-types";
import type { FuentesNegocio } from "@/modules/operacion/domain/fuentes";

/** Llama al modelo y devuelve el objeto estructurado tal cual llegó (sin validar). */
export type Completador = (entrada: { sistema: string; usuario: string }) => Promise<unknown>;

export type GenerarInformeDeps = {
  fuentes: () => FuentesNegocio | Promise<FuentesNegocio>;
  completar: Completador;
  ahora?: () => Date;
};

export async function generarInforme(solicitud: string, deps: GenerarInformeDeps): Promise<Informe> {
  const limpia = sanearSolicitud(solicitud);
  if (limpia.length < MIN_SOLICITUD) {
    throw new SolicitudInvalidaError(`Escribe al menos ${MIN_SOLICITUD} caracteres para pedir el informe.`);
  }
  if (limpia.length > MAX_SOLICITUD) {
    throw new SolicitudInvalidaError(`La solicitud supera los ${MAX_SOLICITUD} caracteres.`);
  }

  const ahora = deps.ahora ? deps.ahora() : new Date();
  const fuentes = await deps.fuentes();
  const contexto = construirContexto(fuentes, ahora);

  const crudo = await deps.completar({
    sistema: SISTEMA,
    usuario: armarMensajeUsuario(limpia, contexto),
  });

  return validarInforme(crudo, fuentes.fuente, ahora);
}
