import { actualizarDatos } from "@/modules/identidad/application/mi-cuenta";
import { conCliente } from "@/modules/identidad/infrastructure/cuenta-http";
import { clientesRepo } from "@/modules/identidad/infrastructure/repositorios";

/** Mis datos: nombre y celular. El correo no se cambia (es el usuario de ingreso). */
export async function PATCH(request: Request) {
  return conCliente(request, async (id, body) => {
    const c = await actualizarDatos(id, body, clientesRepo());
    return { cliente: { nombre: c.nombre, email: c.email, telefono: c.telefono } };
  });
}
