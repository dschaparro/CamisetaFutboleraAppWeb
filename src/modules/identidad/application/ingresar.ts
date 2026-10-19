import { authenticate, type UsuarioRepo } from "@/modules/identidad/domain/authenticate";
import { autenticarCliente, type ClienteRepo } from "@/modules/identidad/domain/cuentas";
import { rutaInicial } from "@/modules/identidad/domain/permisos";
import { signClienteToken, signSessionToken } from "@/modules/identidad/domain/token";

export type ResultadoIngreso =
  | { tipo: "personal"; token: string; destino: string; nombre: string }
  | { tipo: "cliente"; token: string; destino: string; nombre: string };

/**
 * Un solo «Ingresar» para todos: primero busca en el personal y luego en clientes.
 * Si el mismo correo existiera en ambos, gana la cuenta del personal (el registro
 * de clientes ya evita crear ese caso).
 */
export async function ingresar(
  email: string,
  password: string,
  repos: { usuarios: UsuarioRepo; clientes: ClienteRepo },
  secret: string,
): Promise<ResultadoIngreso | null> {
  const usuario = await authenticate(email, password, repos.usuarios);
  if (usuario) {
    const token = await signSessionToken(
      { sub: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol },
      secret,
    );
    return { tipo: "personal", token, destino: rutaInicial(usuario.rol), nombre: usuario.nombre };
  }

  const cliente = await autenticarCliente(email, password, repos.clientes);
  if (cliente) {
    const token = await signClienteToken({ sub: cliente.id, email: cliente.email, nombre: cliente.nombre }, secret);
    return { tipo: "cliente", token, destino: "/cuenta", nombre: cliente.nombre };
  }

  return null;
}
