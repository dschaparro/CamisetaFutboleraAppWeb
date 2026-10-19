import { isValidEmail, normalizeEmail } from "@/modules/identidad/domain/authenticate";
import { DUMMY_PASSWORD_HASH, verifyPassword } from "@/modules/identidad/domain/password";
import { esRol, type Cliente, type ClienteConHash, type Rol } from "@/modules/identidad/domain/types";

export const PASSWORD_MIN = 8;
const PASSWORD_MAX = 128;

/** Datos inválidos en un formulario de cuenta. `campos` trae un mensaje por campo. */
export class CuentaInvalidaError extends Error {
  readonly campos: Record<string, string>;
  constructor(campos: Record<string, string>) {
    super(Object.values(campos)[0] ?? "Datos inválidos");
    this.name = "CuentaInvalidaError";
    this.campos = campos;
  }
}

export class EmailYaRegistradoError extends Error {
  constructor() {
    super("Ya existe una cuenta con ese correo");
    this.name = "EmailYaRegistradoError";
  }
}

/** Cambio no permitido sobre una cuenta del personal (ej. quitarse el propio acceso). */
export class OperacionNoPermitidaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OperacionNoPermitidaError";
  }
}

function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function leerNombre(v: unknown, errores: Record<string, string>): string {
  const nombre = typeof v === "string" ? v.trim().replace(/\s+/g, " ") : "";
  if (nombre.length < 2) errores.nombre = "Escribe tu nombre";
  else if (nombre.length > 80) errores.nombre = "El nombre no puede superar 80 caracteres";
  return nombre;
}

function leerEmail(v: unknown, errores: Record<string, string>): string {
  const email = typeof v === "string" ? normalizeEmail(v) : "";
  if (!isValidEmail(email)) errores.email = "Escribe un correo válido";
  return email;
}

function leerPassword(v: unknown, errores: Record<string, string>): string {
  const password = typeof v === "string" ? v : "";
  if (password.length < PASSWORD_MIN) errores.password = `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`;
  else if (password.length > PASSWORD_MAX) errores.password = `La contraseña no puede superar ${PASSWORD_MAX} caracteres`;
  return password;
}

/** Celular o fijo colombiano: se guardan solo los dígitos (sin +57). Opcional. */
function leerTelefono(v: unknown, errores: Record<string, string>): string | null {
  if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) return null;
  const digitos = typeof v === "string" ? v.replace(/[\s()+-]/g, "").replace(/^57(?=\d{10}$)/, "") : "";
  if (!/^\d{7,10}$/.test(digitos)) {
    errores.telefono = "Escribe un teléfono válido (ej. 322 317 6175)";
    return null;
  }
  return digitos;
}

function terminar<T>(valor: T, errores: Record<string, string>): T {
  if (Object.keys(errores).length > 0) throw new CuentaInvalidaError(errores);
  return valor;
}

export type RegistroCliente = { nombre: string; email: string; telefono: string | null; password: string };

export function validarRegistroCliente(raw: unknown): RegistroCliente {
  if (!esObjeto(raw)) throw new CuentaInvalidaError({ cuenta: "Datos inválidos" });
  const errores: Record<string, string> = {};
  return terminar(
    {
      nombre: leerNombre(raw.nombre, errores),
      email: leerEmail(raw.email, errores),
      telefono: leerTelefono(raw.telefono, errores),
      password: leerPassword(raw.password, errores),
    },
    errores,
  );
}

export type NuevoUsuario = { nombre: string; email: string; rol: Rol; password: string };

export function validarNuevoUsuario(raw: unknown): NuevoUsuario {
  if (!esObjeto(raw)) throw new CuentaInvalidaError({ cuenta: "Datos inválidos" });
  const errores: Record<string, string> = {};
  const rol = raw.rol;
  if (!esRol(rol)) errores.rol = "Elige un rol";
  return terminar(
    {
      nombre: leerNombre(raw.nombre, errores),
      email: leerEmail(raw.email, errores),
      rol: rol as Rol,
      password: leerPassword(raw.password, errores),
    },
    errores,
  );
}

export type CambiosUsuario = Partial<{ nombre: string; rol: Rol; activo: boolean; password: string }>;

/** Solo valida lo que viene. El correo no se cambia (es el usuario de ingreso). */
export function validarCambiosUsuario(raw: unknown): CambiosUsuario {
  if (!esObjeto(raw)) throw new CuentaInvalidaError({ cuenta: "Datos inválidos" });
  const errores: Record<string, string> = {};
  const cambios: CambiosUsuario = {};
  if ("nombre" in raw) cambios.nombre = leerNombre(raw.nombre, errores);
  if ("rol" in raw) {
    if (esRol(raw.rol)) cambios.rol = raw.rol;
    else errores.rol = "Elige un rol";
  }
  if ("activo" in raw) {
    if (typeof raw.activo === "boolean") cambios.activo = raw.activo;
    else errores.activo = "Valor inválido";
  }
  if ("password" in raw) cambios.password = leerPassword(raw.password, errores);
  if (Object.keys(cambios).length === 0 && Object.keys(errores).length === 0) {
    errores.cuenta = "No hay cambios para guardar";
  }
  return terminar(cambios, errores);
}

export type ClienteRepo = {
  findByEmail(email: string): Promise<ClienteConHash | null>;
  findById(id: string): Promise<Cliente | null>;
  crear(datos: { nombre: string; email: string; telefono: string | null; passwordHash: string }): Promise<Cliente>;
};
/** Mismo cuidado que el login del personal: siempre se compara un hash, exista o no la cuenta. */
export async function autenticarCliente(rawEmail: string, password: string, repo: ClienteRepo): Promise<Cliente | null> {
  if (password.length === 0 || password.length > PASSWORD_MAX) return null;
  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) return null;

  const cliente = await repo.findByEmail(email);
  const ok = await verifyPassword(password, cliente?.passwordHash ?? DUMMY_PASSWORD_HASH);
  if (!cliente || !cliente.activo || !ok) return null;
  return { id: cliente.id, email: cliente.email, nombre: cliente.nombre, telefono: cliente.telefono, activo: cliente.activo };
}
