import { createHash, randomBytes } from "node:crypto";
import { isValidEmail, normalizeEmail } from "@/modules/identidad/domain/authenticate";
import { CuentaInvalidaError, PASSWORD_MIN } from "@/modules/identidad/domain/cuentas";

export const RESET_TTL_MS = 60 * 60 * 1000;
const PASSWORD_MAX = 128;
const TOKEN_BYTES = 32;

export type ResetTokenRegistro = {
  tokenHash: string;
  clienteId: string;
  expiraEn: number;
  usadoEn: number | null;
};

export type ResetTokenRepo = {
  guardar(reg: Omit<ResetTokenRegistro, "usadoEn"> & { usadoEn?: null }): Promise<void>;
  buscarPorHash(tokenHash: string): Promise<ResetTokenRegistro | null>;
  marcarUsado(tokenHash: string, ahora?: number): Promise<void>;
  invalidarDeCliente(clienteId: string): Promise<void>;
};

export function generarTokenReset(): string {
  return randomBytes(TOKEN_BYTES).toString("hex");
}

export function hashTokenReset(tokenPlano: string): string {
  return createHash("sha256").update(tokenPlano).digest("hex");
}

export function tokenResetVigente(reg: ResetTokenRegistro, ahora = Date.now()): boolean {
  return reg.usadoEn === null && reg.expiraEn > ahora;
}

function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Solicitud de enlace: solo valida formato de correo. */
export function validarSolicitudReset(raw: unknown): { email: string } {
  if (!esObjeto(raw)) throw new CuentaInvalidaError({ email: "Escribe un correo válido" });
  const email = typeof raw.email === "string" ? normalizeEmail(raw.email) : "";
  if (!isValidEmail(email)) throw new CuentaInvalidaError({ email: "Escribe un correo válido" });
  return { email };
}

/** Nueva contraseña tras el enlace (con confirmación). */
export function validarNuevaPasswordReset(raw: unknown): { password: string } {
  if (!esObjeto(raw)) throw new CuentaInvalidaError({ password: "Datos inválidos" });
  const password = typeof raw.password === "string" ? raw.password : "";
  const confirmar = typeof raw.confirmar === "string" ? raw.confirmar : "";
  const errores: Record<string, string> = {};
  if (password.length < PASSWORD_MIN) {
    errores.password = `La contraseña debe tener al menos ${PASSWORD_MIN} caracteres`;
  } else if (password.length > PASSWORD_MAX) {
    errores.password = `La contraseña no puede superar ${PASSWORD_MAX} caracteres`;
  }
  if (!confirmar) errores.confirmar = "Confirma la contraseña";
  else if (password !== confirmar) errores.confirmar = "Las contraseñas no coinciden";
  if (Object.keys(errores).length) throw new CuentaInvalidaError(errores);
  return { password };
}

export function leerTokenPlano(raw: unknown): string {
  const token = typeof raw === "string" ? raw.trim() : typeof raw === "object" && raw && "token" in raw ? String((raw as { token: unknown }).token ?? "").trim() : "";
  if (!/^[a-f0-9]{64}$/i.test(token)) {
    throw new CuentaInvalidaError({ token: "El enlace no es válido o ya expiró" });
  }
  return token;
}
