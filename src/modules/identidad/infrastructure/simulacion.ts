import type { UsuariosAdminRepo } from "@/modules/identidad/application/gestionar-usuarios";
import { hashPassword } from "@/modules/identidad/domain/password";
import type { ClienteCuentaRepo, PerfilCliente } from "@/modules/identidad/domain/perfil-cliente";
import type { Cliente, ClienteConHash, Usuario, UsuarioConHash } from "@/modules/identidad/domain/types";

/** Contraseña de todas las cuentas de prueba. */
export const PASSWORD_DEMO = "Demo2026!";

export const CUENTAS_DEMO = [
  { email: "admin@demo.co", rol: "Administrador", descripcion: "Todo el panel, incluido Usuarios y roles" },
  { email: "vendedor@demo.co", rol: "Vendedor", descripcion: "Pedidos, venta manual, inventario y lista de compras" },
  { email: "bodega@demo.co", rol: "Bodega", descripcion: "Inventario, lista de compras y pedidos" },
  { email: "marketing@demo.co", rol: "Marketing", descripcion: "Reportes e Informes con IA" },
  { email: "laura@demo.co", rol: "Cliente", descripcion: "Tienda: Mi cuenta y Mis pedidos" },
] as const;

export const CLIENTE_DEMO_ID = "sim-cliente-laura";

type Store = { usuarios: UsuarioConHash[]; clientes: (ClienteConHash & { creadoEn: string })[] };

// En globalThis para que los datos sobrevivan a la recarga en caliente de `npm run dev`.
const global = globalThis as typeof globalThis & { __cfSimIdentidad?: Promise<Store> };

export async function sembrar(): Promise<Store> {
  const hash = await hashPassword(PASSWORD_DEMO);
  const personal = (id: string, nombre: string, email: string, rol: Usuario["rol"]): UsuarioConHash => ({
    id,
    nombre,
    email,
    rol,
    activo: true,
    passwordHash: hash,
  });
  return {
    usuarios: [
      personal("sim-admin", "Administrador Demo", "admin@demo.co", "Administrador"),
      personal("sim-vendedor", "Vendedor Demo", "vendedor@demo.co", "Vendedor"),
      personal("sim-bodega", "Bodega Demo", "bodega@demo.co", "Bodega"),
      personal("sim-marketing", "Marketing Demo", "marketing@demo.co", "Marketing"),
    ],
    clientes: [
      {
        id: CLIENTE_DEMO_ID,
        nombre: "Laura Ramírez",
        email: "laura@demo.co",
        telefono: "3001234567",
        activo: true,
        passwordHash: hash,
        creadoEn: "2026-03-14T15:00:00.000Z",
      },
    ],
  };
}

function store(): Promise<Store> {
  global.__cfSimIdentidad ??= sembrar();
  return global.__cfSimIdentidad;
}

function sinHash<T extends { passwordHash: string }>(cuenta: T): Omit<T, "passwordHash"> {
  const { passwordHash: _omitido, ...resto } = cuenta;
  void _omitido;
  return resto;
}

function nuevoId(prefijo: string): string {
  return `${prefijo}-${crypto.randomUUID()}`;
}

export const usuariosSimulados: UsuariosAdminRepo = {
  async listar() {
    return (await store()).usuarios.map((u) => sinHash(u) as Usuario);
  },
  async findById(id) {
    const u = (await store()).usuarios.find((x) => x.id === id);
    return u ? (sinHash(u) as Usuario) : null;
  },
  async findByEmail(email) {
    return (await store()).usuarios.find((x) => x.email === email) ?? null;
  },
  async crear(datos) {
    const u: UsuarioConHash = { id: nuevoId("sim-usuario"), activo: true, ...datos };
    (await store()).usuarios.push(u);
    return sinHash(u) as Usuario;
  },
  async actualizar(id, cambios) {
    const u = (await store()).usuarios.find((x) => x.id === id);
    if (!u) return null;
    Object.assign(u, cambios);
    return sinHash(u) as Usuario;
  },
};

/** Direcciones y tarjetas de prueba de Laura (tarjeta = solo últimos 4 dígitos, como un token). */
export function perfilesIniciales(): Map<string, PerfilCliente> {
  return new Map([
    [
      CLIENTE_DEMO_ID,
      {
        direcciones: [
          { id: "sim-dir-casa", alias: "Casa", destinatario: "Laura Ramírez", telefono: "3001234567", direccion: "Cra 45 # 12-30, Apto 301", ciudad: "Bogotá", indicaciones: "Portería 24 horas", predeterminada: true },
          { id: "sim-dir-oficina", alias: "Oficina", destinatario: "Laura Ramírez", telefono: "3001234567", direccion: "Cl 93 # 11-26, Piso 4", ciudad: "Bogotá", indicaciones: "Dejar en recepción", predeterminada: false },
        ],
        tarjetas: [{ id: "sim-tarjeta-visa", marca: "Visa", ultimos4: "4242", vencimiento: "12/30", titular: "LAURA RAMIREZ", predeterminada: true }],
      },
    ],
  ]);
}

// Aparte del store principal para no romper datos ya sembrados en un `npm run dev` en curso.
const globalPerfiles = globalThis as typeof globalThis & { __cfSimPerfiles?: Map<string, PerfilCliente> };
function perfiles(): Map<string, PerfilCliente> {
  globalPerfiles.__cfSimPerfiles ??= perfilesIniciales();
  return globalPerfiles.__cfSimPerfiles;
}

export const clientesSimulados: ClienteCuentaRepo = {
  async findConHashById(id) {
    return (await store()).clientes.find((x) => x.id === id) ?? null;
  },
  async actualizar(id, cambios) {
    const c = (await store()).clientes.find((x) => x.id === id);
    if (!c) return null;
    Object.assign(c, cambios);
    return { id: c.id, email: c.email, nombre: c.nombre, telefono: c.telefono, activo: c.activo };
  },
  async perfil(id) {
    const p = perfiles().get(id) ?? { direcciones: [], tarjetas: [] };
    return structuredClone(p);
  },
  async guardarPerfil(id, perfil) {
    perfiles().set(id, structuredClone(perfil));
  },
  async findByEmail(email) {
    return (await store()).clientes.find((x) => x.email === email) ?? null;
  },
  async findById(id) {
    const c = (await store()).clientes.find((x) => x.id === id);
    if (!c) return null;
    const { creadoEn: _creado, ...resto } = sinHash(c);
    void _creado;
    return resto as Cliente;
  },
  async crear(datos) {
    const c = { id: nuevoId("sim-cliente"), activo: true, creadoEn: new Date().toISOString(), ...datos };
    (await store()).clientes.push(c);
    return { id: c.id, email: c.email, nombre: c.nombre, telefono: c.telefono, activo: c.activo };
  },
};
