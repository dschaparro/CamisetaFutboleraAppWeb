/**
 * Tipos y límites de «Mi cuenta» sin dependencias de servidor:
 * los pueden importar los componentes del navegador.
 */
import type { MarcaTarjeta } from "@/lib/tarjetas";

export const MAX_DIRECCIONES = 5;
export const MAX_TARJETAS = 5;

export type Direccion = {
  id: string;
  alias: string;
  destinatario: string;
  telefono: string;
  direccion: string;
  ciudad: string;
  indicaciones: string;
  predeterminada: boolean;
};

/**
 * Tarjeta guardada. Nunca se guarda el número completo ni el CVC: solo marca,
 * últimos 4 dígitos, vencimiento y titular (como haría una pasarela con un token).
 */
export type TarjetaGuardada = {
  id: string;
  marca: MarcaTarjeta;
  ultimos4: string;
  vencimiento: string;
  titular: string;
  predeterminada: boolean;
};

export type PerfilCliente = { direcciones: Direccion[]; tarjetas: TarjetaGuardada[] };
