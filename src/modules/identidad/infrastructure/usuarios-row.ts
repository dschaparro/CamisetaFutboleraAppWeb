import type { Rol, UsuarioConHash } from "@/modules/identidad/domain/types";
import { ROLES } from "@/modules/identidad/domain/types";

export type UsuarioRow = {
  id: string;
  email: string;
  nombre: string;
  rol: string;
  password_hash: string;
  activo: boolean;
};

function isRol(value: string): value is Rol {
  return (ROLES as readonly string[]).includes(value);
}

export function toUsuario(row: UsuarioRow): UsuarioConHash | null {
  if (!isRol(row.rol)) return null;
  return {
    id: row.id,
    email: row.email,
    nombre: row.nombre,
    rol: row.rol,
    activo: row.activo,
    passwordHash: row.password_hash,
  };
}
