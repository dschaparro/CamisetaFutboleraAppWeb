import { authenticate, type UsuarioRepo } from "@/modules/identidad/domain/authenticate";
import { signSessionToken } from "@/modules/identidad/domain/token";
import type { Usuario } from "@/modules/identidad/domain/types";

export async function iniciarSesion(
  email: string,
  password: string,
  repo: UsuarioRepo,
  secret: string,
): Promise<{ user: Usuario; token: string } | null> {
  const user = await authenticate(email, password, repo);
  if (!user) return null;

  const token = await signSessionToken(
    { sub: user.id, email: user.email, nombre: user.nombre, rol: user.rol },
    secret,
  );

  return { user, token };
}
