export const ROLES = ["Administrador", "Vendedor"] as const;

export type Rol = (typeof ROLES)[number];

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
