import {
  EmailYaRegistradoError,
  OperacionNoPermitidaError,
  validarCambiosUsuario,
  validarNuevoUsuario,
  type ClienteRepo,
} from "@/modules/identidad/domain/cuentas";
import { hashPassword } from "@/modules/identidad/domain/password";
import type { Rol, Usuario, UsuarioConHash } from "@/modules/identidad/domain/types";

export type UsuariosAdminRepo = {
  listar(): Promise<Usuario[]>;
  findById(id: string): Promise<Usuario | null>;
  findByEmail(email: string): Promise<UsuarioConHash | null>;
  crear(datos: { nombre: string; email: string; rol: Rol; passwordHash: string }): Promise<Usuario>;
  actualizar(
    id: string,
    cambios: Partial<{ nombre: string; rol: Rol; activo: boolean; passwordHash: string }>,
  ): Promise<Usuario | null>;
};

export async function crearUsuario(
  raw: unknown,
  repos: { usuarios: UsuariosAdminRepo; clientes: ClienteRepo },
): Promise<Usuario> {
  const datos = validarNuevoUsuario(raw);
  if ((await repos.usuarios.findByEmail(datos.email)) || (await repos.clientes.findByEmail(datos.email))) {
    throw new EmailYaRegistradoError();
  }
  return repos.usuarios.crear({
    nombre: datos.nombre,
    email: datos.email,
    rol: datos.rol,
    passwordHash: await hashPassword(datos.password),
  });
}

/**
 * Edita una cuenta del personal. Protege contra quedarse sin acceso:
 * nadie se desactiva ni se quita el rol de Administrador a sí mismo, y
 * siempre queda al menos un Administrador activo.
 */
export async function actualizarUsuario(
  actorId: string,
  id: string,
  raw: unknown,
  repo: UsuariosAdminRepo,
): Promise<Usuario | null> {
  const cambios = validarCambiosUsuario(raw);
  const actual = await repo.findById(id);
  if (!actual) return null;

  const pierdeAdmin =
    actual.rol === "Administrador" && actual.activo && (cambios.activo === false || (cambios.rol && cambios.rol !== "Administrador"));

  if (id === actorId && pierdeAdmin) {
    throw new OperacionNoPermitidaError("No puedes quitarte tu propio acceso de Administrador.");
  }
  if (pierdeAdmin) {
    const adminsActivos = (await repo.listar()).filter((u) => u.rol === "Administrador" && u.activo);
    if (adminsActivos.length <= 1) {
      throw new OperacionNoPermitidaError("Debe quedar al menos un Administrador activo.");
    }
  }

  const { password, ...resto } = cambios;
  return repo.actualizar(id, password ? { ...resto, passwordHash: await hashPassword(password) } : resto);
}
