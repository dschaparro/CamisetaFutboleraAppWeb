import { esDuplicado, query, transaccion } from "@/lib/db";
import type { UsuariosAdminRepo } from "@/modules/identidad/application/gestionar-usuarios";
import { EmailYaRegistradoError } from "@/modules/identidad/domain/cuentas";
import type { ClienteCuentaRepo } from "@/modules/identidad/domain/perfil-cliente";
import type { Cliente, ClienteConHash, Rol, Usuario, UsuarioConHash } from "@/modules/identidad/domain/types";

/** Cuentas del personal y de clientes en PostgreSQL (Supabase). Misma forma que la simulación. */

type Fila = Record<string, unknown>;

const aUsuario = (r: Fila): Usuario => ({
  id: r.id as string,
  email: r.email as string,
  nombre: r.nombre as string,
  rol: r.rol as Rol,
  activo: r.activo as boolean,
});
const aUsuarioConHash = (r: Fila): UsuarioConHash => ({ ...aUsuario(r), passwordHash: r.password_hash as string });

const aCliente = (r: Fila): Cliente => ({
  id: r.id as string,
  email: r.email as string,
  nombre: r.nombre as string,
  telefono: (r.telefono as string | null) ?? null,
  activo: r.activo as boolean,
});
const aClienteConHash = (r: Fila): ClienteConHash => ({ ...aCliente(r), passwordHash: r.password_hash as string });

const COLS_USUARIO = "id, email, nombre, rol, activo, password_hash";
const COLS_CLIENTE = "id, email, nombre, telefono, activo, password_hash";

/** Un id que no es uuid (por ejemplo de la simulación) no existe en la base: evita el error de tipo. */
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Arma `col = $2, col2 = $3…` solo con los cambios que vienen definidos. */
function sentenciaSet(cambios: Record<string, unknown>, columnas: Record<string, string>) {
  const campos = Object.entries(cambios).filter(([k, v]) => k in columnas && v !== undefined);
  return {
    vacio: campos.length === 0,
    set: campos.map(([k], i) => `${columnas[k]} = $${i + 2}`).join(", "),
    valores: campos.map(([, v]) => v),
  };
}

export const usuariosPg: UsuariosAdminRepo = {
  async listar() {
    return (await query(`select ${COLS_USUARIO} from public.usuarios order by created_at`)).map(aUsuario);
  },
  async findById(id) {
    if (!UUID.test(id)) return null;
    const r = await query(`select ${COLS_USUARIO} from public.usuarios where id = $1`, [id]);
    return r[0] ? aUsuario(r[0]) : null;
  },
  async findByEmail(email) {
    const r = await query(`select ${COLS_USUARIO} from public.usuarios where email = $1`, [email]);
    return r[0] ? aUsuarioConHash(r[0]) : null;
  },
  async crear(d) {
    try {
      const r = await query(
        `insert into public.usuarios (nombre, email, rol, password_hash) values ($1, $2, $3, $4) returning ${COLS_USUARIO}`,
        [d.nombre, d.email, d.rol, d.passwordHash],
      );
      return aUsuario(r[0]);
    } catch (e) {
      if (esDuplicado(e)) throw new EmailYaRegistradoError();
      throw e;
    }
  },
  async actualizar(id, cambios) {
    if (!UUID.test(id)) return null;
    const s = sentenciaSet(cambios, { nombre: "nombre", rol: "rol", activo: "activo", passwordHash: "password_hash" });
    if (s.vacio) return usuariosPg.findById(id);
    const r = await query(`update public.usuarios set ${s.set} where id = $1 returning ${COLS_USUARIO}`, [id, ...s.valores]);
    return r[0] ? aUsuario(r[0]) : null;
  },
};

export const clientesPg: ClienteCuentaRepo = {
  async findByEmail(email) {
    const r = await query(`select ${COLS_CLIENTE} from public.clientes where email = $1`, [email]);
    return r[0] ? aClienteConHash(r[0]) : null;
  },
  async findById(id) {
    if (!UUID.test(id)) return null;
    const r = await query(`select ${COLS_CLIENTE} from public.clientes where id = $1`, [id]);
    return r[0] ? aCliente(r[0]) : null;
  },
  async findConHashById(id) {
    if (!UUID.test(id)) return null;
    const r = await query(`select ${COLS_CLIENTE} from public.clientes where id = $1`, [id]);
    return r[0] ? aClienteConHash(r[0]) : null;
  },
  async crear(d) {
    try {
      const r = await query(
        `insert into public.clientes (nombre, email, telefono, password_hash) values ($1, $2, $3, $4) returning ${COLS_CLIENTE}`,
        [d.nombre, d.email, d.telefono, d.passwordHash],
      );
      return aCliente(r[0]);
    } catch (e) {
      if (esDuplicado(e)) throw new EmailYaRegistradoError();
      throw e;
    }
  },
  async actualizar(id, cambios) {
    if (!UUID.test(id)) return null;
    const s = sentenciaSet(cambios, { nombre: "nombre", telefono: "telefono", passwordHash: "password_hash" });
    if (s.vacio) return clientesPg.findById(id);
    const r = await query(`update public.clientes set ${s.set} where id = $1 returning ${COLS_CLIENTE}`, [id, ...s.valores]);
    return r[0] ? aCliente(r[0]) : null;
  },
  async perfil(id) {
    if (!UUID.test(id)) return { direcciones: [], tarjetas: [] };
    const [dirs, tars] = await Promise.all([
      query("select * from public.direcciones where cliente_id = $1 order by orden", [id]),
      query("select * from public.tarjetas_guardadas where cliente_id = $1 order by orden", [id]),
    ]);
    return {
      direcciones: dirs.map((d) => ({
        id: d.id as string,
        alias: d.alias as string,
        destinatario: d.destinatario as string,
        telefono: d.telefono as string,
        direccion: d.direccion as string,
        ciudad: d.ciudad as string,
        indicaciones: d.indicaciones as string,
        predeterminada: d.predeterminada as boolean,
      })),
      tarjetas: tars.map((t) => ({
        id: t.id as string,
        marca: t.marca as never,
        ultimos4: t.ultimos4 as string,
        vencimiento: t.vencimiento as string,
        titular: t.titular as string,
        predeterminada: t.predeterminada as boolean,
      })),
    };
  },
  async guardarPerfil(id, perfil) {
    if (!UUID.test(id)) return;
    await transaccion(async (c) => {
      await c.query("delete from public.direcciones where cliente_id = $1", [id]);
      await c.query("delete from public.tarjetas_guardadas where cliente_id = $1", [id]);
      for (const [i, d] of perfil.direcciones.entries()) {
        await c.query(
          "insert into public.direcciones (id, cliente_id, alias, destinatario, telefono, direccion, ciudad, indicaciones, predeterminada, orden) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)",
          [d.id, id, d.alias, d.destinatario, d.telefono, d.direccion, d.ciudad, d.indicaciones, d.predeterminada, i],
        );
      }
      for (const [i, t] of perfil.tarjetas.entries()) {
        await c.query(
          "insert into public.tarjetas_guardadas (id, cliente_id, marca, ultimos4, vencimiento, titular, predeterminada, orden) values ($1,$2,$3,$4,$5,$6,$7,$8)",
          [t.id, id, t.marca, t.ultimos4, t.vencimiento, t.titular, t.predeterminada, i],
        );
      }
    });
  },
};
