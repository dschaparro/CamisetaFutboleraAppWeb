import { DUMMY_PASSWORD_HASH, verifyPassword } from "@/modules/identidad/domain/password";
import type { Usuario, UsuarioConHash } from "@/modules/identidad/domain/types";

export type UsuarioRepo = {
  findByEmail(email: string): Promise<UsuarioConHash | null>;
};

const EMAIL_MAX = 254;
const PASSWORD_MAX = 128;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  if (email.length === 0 || email.length > EMAIL_MAX) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function authenticate(
  rawEmail: string,
  password: string,
  repo: UsuarioRepo,
): Promise<Usuario | null> {
  if (password.length === 0 || password.length > PASSWORD_MAX) return null;

  const email = normalizeEmail(rawEmail);
  if (!isValidEmail(email)) return null;

  const user = await repo.findByEmail(email);
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_PASSWORD_HASH);

  if (!user || !user.activo || !ok) return null;

  return {
    id: user.id,
    email: user.email,
    nombre: user.nombre,
    rol: user.rol,
    activo: user.activo,
  };
}
