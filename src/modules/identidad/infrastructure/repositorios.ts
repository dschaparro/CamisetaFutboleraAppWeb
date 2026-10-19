import { usarSimulacion } from "@/lib/modo-datos";
import type { UsuariosAdminRepo } from "@/modules/identidad/application/gestionar-usuarios";
import type { ClienteCuentaRepo } from "@/modules/identidad/domain/perfil-cliente";
import { clientesPg, usuariosPg } from "@/modules/identidad/infrastructure/repositorios-pg";
import { clientesSimulados, usuariosSimulados } from "@/modules/identidad/infrastructure/simulacion";

/** Único punto donde se elige de dónde salen las cuentas: simulación (DATOS_SIMULADOS=true) o Supabase. */
export function usuariosRepo(): UsuariosAdminRepo {
  return usarSimulacion() ? usuariosSimulados : usuariosPg;
}

export function clientesRepo(): ClienteCuentaRepo {
  return usarSimulacion() ? clientesSimulados : clientesPg;
}
