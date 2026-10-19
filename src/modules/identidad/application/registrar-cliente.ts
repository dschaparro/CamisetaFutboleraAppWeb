import type { UsuarioRepo } from "@/modules/identidad/domain/authenticate";
import { EmailYaRegistradoError, validarRegistroCliente, type ClienteRepo } from "@/modules/identidad/domain/cuentas";
import { hashPassword } from "@/modules/identidad/domain/password";
import { signClienteToken } from "@/modules/identidad/domain/token";
import type { Cliente } from "@/modules/identidad/domain/types";

export async function registrarCliente(
  raw: unknown,
  repos: { clientes: ClienteRepo; usuarios: UsuarioRepo },
  secret: string,
): Promise<{ cliente: Cliente; token: string }> {
  const datos = validarRegistroCliente(raw);

  // Un correo del personal tampoco se puede usar: el login único lo mandaría al panel.
  if ((await repos.clientes.findByEmail(datos.email)) || (await repos.usuarios.findByEmail(datos.email))) {
    throw new EmailYaRegistradoError();
  }

  const cliente = await repos.clientes.crear({
    nombre: datos.nombre,
    email: datos.email,
    telefono: datos.telefono,
    passwordHash: await hashPassword(datos.password),
  });
  const token = await signClienteToken({ sub: cliente.id, email: cliente.email, nombre: cliente.nombre }, secret);
  return { cliente, token };
}
