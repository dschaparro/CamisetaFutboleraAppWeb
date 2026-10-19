import { NextResponse } from "next/server";
import { PendienteDeBaseDeDatosError } from "@/lib/modo-datos";
import { crearUsuario } from "@/modules/identidad/application/gestionar-usuarios";
import { CuentaInvalidaError, EmailYaRegistradoError } from "@/modules/identidad/domain/cuentas";
import { clientesRepo, usuariosRepo } from "@/modules/identidad/infrastructure/repositorios";
import { errorJson } from "@/modules/identidad/infrastructure/sesiones";

// El acceso (solo Administrador) lo controla proxy.ts con la tabla de permisos.

export async function GET() {
  try {
    const usuarios = await usuariosRepo().listar();
    return NextResponse.json({ usuarios: usuarios.sort((a, b) => a.nombre.localeCompare(b.nombre, "es")) });
  } catch (err) {
    if (err instanceof PendienteDeBaseDeDatosError) return errorJson(503, "PENDIENTE_BD", err.message);
    throw err;
  }
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return errorJson(400, "VALIDATION_ERROR", "Cuerpo JSON inválido");
  }
  try {
    const usuario = await crearUsuario(body, { usuarios: usuariosRepo(), clientes: clientesRepo() });
    return NextResponse.json({ usuario }, { status: 201 });
  } catch (err) {
    if (err instanceof CuentaInvalidaError) return errorJson(400, "VALIDATION_ERROR", err.message, err.campos);
    if (err instanceof EmailYaRegistradoError) {
      return errorJson(409, "EMAIL_EN_USO", "Ese correo ya tiene una cuenta", { email: "Ese correo ya tiene una cuenta" });
    }
    if (err instanceof PendienteDeBaseDeDatosError) return errorJson(503, "PENDIENTE_BD", err.message);
    throw err;
  }
}
