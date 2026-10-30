import { hashPassword } from "@/modules/identidad/domain/password";
import type { UsuariosAdminRepo } from "@/modules/identidad/application/gestionar-usuarios";
import { CuentaInvalidaError, type ClienteRepo } from "@/modules/identidad/domain/cuentas";
import type { ClienteCuentaRepo } from "@/modules/identidad/domain/perfil-cliente";
import {
  RESET_TTL_MS,
  generarTokenReset,
  hashTokenReset,
  leerTokenPlano,
  tokenResetVigente,
  validarNuevaPasswordReset,
  validarSolicitudReset,
  type ResetTokenRepo,
} from "@/modules/identidad/domain/reset-password";

export type NotificadorReset = {
  enviarEnlaceReset(datos: { email: string; nombre: string; url: string }): Promise<void>;
};

export type ResultadoSolicitudReset =
  | { estado: "enviado"; email: string }
  | { estado: "sin_cuenta"; email: string }
  | { estado: "cuenta_equipo"; email: string };

/**
 * Solicita restablecer la contraseña de un cliente de la tienda.
 * El personal del panel no usa este flujo (estado cuenta_equipo).
 */
export async function solicitarResetPassword(
  raw: unknown,
  deps: {
    clientes: ClienteRepo;
    usuarios: UsuariosAdminRepo;
    tokens: ResetTokenRepo;
    mail: NotificadorReset;
    baseUrl: string;
    ahora?: number;
  },
): Promise<ResultadoSolicitudReset> {
  const { email } = validarSolicitudReset(raw);
  const ahora = deps.ahora ?? Date.now();

  const personal = await deps.usuarios.findByEmail(email);
  const cliente = await deps.clientes.findByEmail(email);

  if (personal && !cliente) {
    return { estado: "cuenta_equipo", email };
  }
  if (!cliente || !cliente.activo) {
    return { estado: "sin_cuenta", email };
  }

  const tokenPlano = generarTokenReset();
  await deps.tokens.invalidarDeCliente(cliente.id);
  await deps.tokens.guardar({
    tokenHash: hashTokenReset(tokenPlano),
    clienteId: cliente.id,
    expiraEn: ahora + RESET_TTL_MS,
    usadoEn: null,
  });

  const base = deps.baseUrl.replace(/\/$/, "");
  await deps.mail.enviarEnlaceReset({
    email: cliente.email,
    nombre: cliente.nombre,
    url: `${base}/recuperar/nueva?token=${tokenPlano}`,
  });

  return { estado: "enviado", email: cliente.email };
}

/** Comprueba si el token del enlace sigue vigente (para la UI antes de mostrar el formulario). */
export async function inspeccionarTokenReset(
  tokenRaw: unknown,
  tokens: ResetTokenRepo,
  ahora = Date.now(),
): Promise<{ ok: true } | { ok: false; motivo: string }> {
  try {
    const plano = leerTokenPlano(tokenRaw);
    const reg = await tokens.buscarPorHash(hashTokenReset(plano));
    if (!reg || !tokenResetVigente(reg, ahora)) {
      return { ok: false, motivo: "El enlace no es válido o ya expiró. Solicita uno nuevo." };
    }
    return { ok: true };
  } catch (err) {
    if (err instanceof CuentaInvalidaError) {
      return { ok: false, motivo: err.campos.token ?? err.message };
    }
    throw err;
  }
}

/** Aplica la nueva contraseña y consume el token. */
export async function confirmarResetPassword(
  raw: unknown,
  deps: { clientes: ClienteCuentaRepo; tokens: ResetTokenRepo; ahora?: number },
): Promise<void> {
  const ahora = deps.ahora ?? Date.now();
  if (!raw || typeof raw !== "object") throw new CuentaInvalidaError({ token: "Datos inválidos" });
  const cuerpo = raw as Record<string, unknown>;
  const plano = leerTokenPlano(cuerpo.token);
  const { password } = validarNuevaPasswordReset(cuerpo);

  const hash = hashTokenReset(plano);
  const reg = await deps.tokens.buscarPorHash(hash);
  if (!reg || !tokenResetVigente(reg, ahora)) {
    throw new CuentaInvalidaError({ token: "El enlace no es válido o ya expiró. Solicita uno nuevo." });
  }

  await deps.clientes.actualizar(reg.clienteId, { passwordHash: await hashPassword(password) });
  await deps.tokens.marcarUsado(hash, ahora);
  await deps.tokens.invalidarDeCliente(reg.clienteId);
}
