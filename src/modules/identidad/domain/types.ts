export const ROLES = ["Administrador", "Vendedor", "Bodega", "Marketing"] as const;

export type Rol = (typeof ROLES)[number];

export function esRol(value: unknown): value is Rol {
  return typeof value === "string" && (ROLES as readonly string[]).includes(value);
}

export type Usuario = {
  id: string;
  email: string;
  nombre: string;
  rol: Rol;
  activo: boolean;
};

export type UsuarioConHash = Usuario & {
  passwordHash: string;
};

/** Cliente de la tienda en línea. Separado del personal: otro login y otra sesión. */
export type Cliente = {
  id: string;
  email: string;
  nombre: string;
  telefono: string | null;
  activo: boolean;
};

export type ClienteConHash = Cliente & {
  passwordHash: string;
};
