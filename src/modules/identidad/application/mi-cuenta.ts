import { CuentaInvalidaError } from "@/modules/identidad/domain/cuentas";
import { hashPassword, verifyPassword } from "@/modules/identidad/domain/password";
import {
  agregarDireccion,
  agregarTarjeta,
  editarDireccion,
  eliminar,
  marcarPredeterminada,
  validarCambioPassword,
  validarDatosPersonales,
  validarDireccion,
  validarTarjetaNueva,
  type ClienteCuentaRepo,
  type PerfilCliente,
} from "@/modules/identidad/domain/perfil-cliente";
import type { Cliente } from "@/modules/identidad/domain/types";

export class NoEncontradoError extends Error {
  constructor(que: string) {
    super(`No encontramos ${que}`);
    this.name = "NoEncontradoError";
  }
}

export async function actualizarDatos(clienteId: string, raw: unknown, repo: ClienteCuentaRepo): Promise<Cliente> {
  const datos = validarDatosPersonales(raw);
  const cliente = await repo.actualizar(clienteId, datos);
  if (!cliente) throw new NoEncontradoError("tu cuenta");
  return cliente;
}

/** Exige la contraseña actual: así nadie la cambia con una sesión abierta ajena. */
export async function cambiarPassword(clienteId: string, raw: unknown, repo: ClienteCuentaRepo): Promise<void> {
  const { actual, nueva } = validarCambioPassword(raw);
  const cliente = await repo.findConHashById(clienteId);
  if (!cliente) throw new NoEncontradoError("tu cuenta");
  if (!(await verifyPassword(actual, cliente.passwordHash))) {
    throw new CuentaInvalidaError({ actual: "La contraseña actual no es correcta" });
  }
  await repo.actualizar(clienteId, { passwordHash: await hashPassword(nueva) });
}

type Operacion =
  | { tipo: "agregar-direccion"; raw: unknown; id: string }
  | { tipo: "editar-direccion"; id: string; raw: unknown }
  | { tipo: "predeterminada-direccion"; id: string }
  | { tipo: "eliminar-direccion"; id: string }
  | { tipo: "agregar-tarjeta"; raw: unknown; id: string }
  | { tipo: "predeterminada-tarjeta"; id: string }
  | { tipo: "eliminar-tarjeta"; id: string };

/** Aplica un cambio a direcciones o tarjetas y devuelve el perfil actualizado. */
export async function cambiarPerfil(clienteId: string, op: Operacion, repo: ClienteCuentaRepo): Promise<PerfilCliente> {
  const perfil = await repo.perfil(clienteId);
  let { direcciones, tarjetas } = perfil;

  const exigir = <T>(v: T | null, que: string): T => {
    if (v === null) throw new NoEncontradoError(que);
    return v;
  };

  switch (op.tipo) {
    case "agregar-direccion": {
      const raw = op.raw as Record<string, unknown> | null;
      direcciones = agregarDireccion(direcciones, validarDireccion(raw), op.id, raw?.predeterminada === true);
      break;
    }
    case "editar-direccion":
      direcciones = exigir(editarDireccion(direcciones, op.id, validarDireccion(op.raw)), "esa dirección");
      break;
    case "predeterminada-direccion":
      direcciones = exigir(marcarPredeterminada(direcciones, op.id), "esa dirección");
      break;
    case "eliminar-direccion":
      direcciones = exigir(eliminar(direcciones, op.id), "esa dirección");
      break;
    case "agregar-tarjeta":
      tarjetas = agregarTarjeta(tarjetas, validarTarjetaNueva(op.raw), op.id);
      break;
    case "predeterminada-tarjeta":
      tarjetas = exigir(marcarPredeterminada(tarjetas, op.id), "esa tarjeta");
      break;
    case "eliminar-tarjeta":
      tarjetas = exigir(eliminar(tarjetas, op.id), "esa tarjeta");
      break;
  }

  const nuevo = { direcciones, tarjetas };
  await repo.guardarPerfil(clienteId, nuevo);
  return nuevo;
}
