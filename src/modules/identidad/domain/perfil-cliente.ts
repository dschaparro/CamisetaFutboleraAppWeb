import { luhn, marcaTarjeta, soloDigitos, vencimientoValido } from "@/lib/tarjetas";
import { CuentaInvalidaError, PASSWORD_MIN, type ClienteRepo } from "@/modules/identidad/domain/cuentas";
import type { Cliente, ClienteConHash } from "@/modules/identidad/domain/types";

/** Submódulos de «Mi cuenta»: datos, contraseña, direcciones y formas de pago. */

import { MAX_DIRECCIONES, MAX_TARJETAS, type Direccion, type PerfilCliente, type TarjetaGuardada } from "@/modules/identidad/domain/perfil-tipos";

export { MAX_DIRECCIONES, MAX_TARJETAS, type Direccion, type PerfilCliente, type TarjetaGuardada };

/** Lo que necesita «Mi cuenta» además del login. */
export type ClienteCuentaRepo = ClienteRepo & {
  findConHashById(id: string): Promise<ClienteConHash | null>;
  actualizar(id: string, cambios: Partial<{ nombre: string; telefono: string | null; passwordHash: string }>): Promise<Cliente | null>;
  perfil(id: string): Promise<PerfilCliente>;
  guardarPerfil(id: string, perfil: PerfilCliente): Promise<void>;
};

function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function texto(v: unknown): string {
  return typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
}

function telefono(v: unknown, errores: Record<string, string>): string {
  const d = soloDigitos(v).replace(/^57(?=\d{10}$)/, "");
  if (!/^\d{7,10}$/.test(d)) errores.telefono = "Escribe un teléfono válido";
  return d;
}

function fallarSi(errores: Record<string, string>) {
  if (Object.keys(errores).length > 0) throw new CuentaInvalidaError(errores);
}

/* ---------- Mis datos ---------- */

export function validarDatosPersonales(raw: unknown): { nombre: string; telefono: string | null } {
  if (!esObjeto(raw)) throw new CuentaInvalidaError({ cuenta: "Datos inválidos" });
  const errores: Record<string, string> = {};
  const nombre = texto(raw.nombre);
  if (nombre.length < 2 || nombre.length > 80) errores.nombre = "Escribe tu nombre (2 a 80 caracteres)";
  const tel = texto(raw.telefono) === "" ? null : telefono(raw.telefono, errores);
  fallarSi(errores);
  return { nombre, telefono: tel };
}

/* ---------- Contraseña ---------- */

export function validarCambioPassword(raw: unknown): { actual: string; nueva: string } {
  if (!esObjeto(raw)) throw new CuentaInvalidaError({ cuenta: "Datos inválidos" });
  const errores: Record<string, string> = {};
  const actual = typeof raw.actual === "string" ? raw.actual : "";
  const nueva = typeof raw.nueva === "string" ? raw.nueva : "";
  if (!actual) errores.actual = "Escribe tu contraseña actual";
  if (nueva.length < PASSWORD_MIN) errores.nueva = `La nueva contraseña debe tener al menos ${PASSWORD_MIN} caracteres`;
  else if (nueva.length > 128) errores.nueva = "La contraseña no puede superar 128 caracteres";
  else if (nueva === actual) errores.nueva = "La nueva contraseña debe ser distinta de la actual";
  fallarSi(errores);
  return { actual, nueva };
}

/* ---------- Direcciones ---------- */

export function validarDireccion(raw: unknown): Omit<Direccion, "id" | "predeterminada"> {
  if (!esObjeto(raw)) throw new CuentaInvalidaError({ direccion: "Datos inválidos" });
  const errores: Record<string, string> = {};
  const alias = texto(raw.alias) || "Mi dirección";
  if (alias.length > 30) errores.alias = "El nombre de la dirección es muy largo";
  const destinatario = texto(raw.destinatario);
  if (destinatario.length < 3) errores.destinatario = "Escribe quién recibe";
  const tel = telefono(raw.telefono, errores);
  const direccion = texto(raw.direccion);
  if (direccion.length < 5) errores.direccion = "Escribe la dirección completa";
  const ciudad = texto(raw.ciudad);
  if (ciudad.length < 3) errores.ciudad = "Escribe la ciudad";
  const indicaciones = texto(raw.indicaciones).slice(0, 120);
  fallarSi(errores);
  return { alias, destinatario, telefono: tel, direccion, ciudad, indicaciones };
}

/** Garantiza exactamente una predeterminada (la primera, si ninguna lo es). */
function normalizar<T extends { predeterminada: boolean }>(lista: T[]): T[] {
  if (lista.length === 0) return lista;
  const i = Math.max(0, lista.findIndex((x) => x.predeterminada));
  return lista.map((x, j) => ({ ...x, predeterminada: j === i }));
}

export function agregarDireccion(lista: Direccion[], datos: Omit<Direccion, "id" | "predeterminada">, id: string, predeterminada = false): Direccion[] {
  if (lista.length >= MAX_DIRECCIONES) throw new CuentaInvalidaError({ direccion: `Puedes guardar hasta ${MAX_DIRECCIONES} direcciones` });
  const nueva = { ...datos, id, predeterminada: predeterminada || lista.length === 0 };
  const base = nueva.predeterminada ? lista.map((d) => ({ ...d, predeterminada: false })) : lista;
  return normalizar([...base, nueva]);
}

export function editarDireccion(lista: Direccion[], id: string, datos: Omit<Direccion, "id" | "predeterminada">): Direccion[] | null {
  if (!lista.some((d) => d.id === id)) return null;
  return lista.map((d) => (d.id === id ? { ...d, ...datos } : d));
}

/* ---------- Común: predeterminada y eliminar ---------- */

export function marcarPredeterminada<T extends { id: string; predeterminada: boolean }>(lista: T[], id: string): T[] | null {
  if (!lista.some((x) => x.id === id)) return null;
  return lista.map((x) => ({ ...x, predeterminada: x.id === id }));
}

/** Si se borra la predeterminada, la siguiente pasa a serlo. */
export function eliminar<T extends { id: string; predeterminada: boolean }>(lista: T[], id: string): T[] | null {
  if (!lista.some((x) => x.id === id)) return null;
  return normalizar(lista.filter((x) => x.id !== id));
}

/* ---------- Formas de pago ---------- */

export function validarTarjetaNueva(raw: unknown): Omit<TarjetaGuardada, "id" | "predeterminada"> {
  if (!esObjeto(raw)) throw new CuentaInvalidaError({ numero: "Datos inválidos" });
  const errores: Record<string, string> = {};
  const numero = soloDigitos(raw.numero);
  if (!/^\d{15,16}$/.test(numero) || !luhn(numero)) errores.numero = "Número de tarjeta inválido";
  const vencimiento = texto(raw.vencimiento);
  if (!vencimientoValido(vencimiento)) errores.vencimiento = "Fecha inválida o vencida (MM/AA)";
  const titular = texto(raw.titular).toUpperCase();
  if (titular.length < 3) errores.titular = "Escribe el nombre como aparece en la tarjeta";
  fallarSi(errores);
  // A partir de aquí el número completo se descarta.
  return { marca: marcaTarjeta(numero), ultimos4: numero.slice(-4), vencimiento, titular };
}

export function agregarTarjeta(lista: TarjetaGuardada[], datos: Omit<TarjetaGuardada, "id" | "predeterminada">, id: string): TarjetaGuardada[] {
  if (lista.length >= MAX_TARJETAS) throw new CuentaInvalidaError({ numero: `Puedes guardar hasta ${MAX_TARJETAS} tarjetas` });
  if (lista.some((t) => t.ultimos4 === datos.ultimos4 && t.vencimiento === datos.vencimiento && t.marca === datos.marca)) {
    throw new CuentaInvalidaError({ numero: "Esa tarjeta ya está guardada" });
  }
  return normalizar([...lista, { ...datos, id, predeterminada: lista.length === 0 }]);
}
