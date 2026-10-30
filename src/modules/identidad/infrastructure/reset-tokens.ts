import { query } from "@/lib/db";
import { usarSimulacion } from "@/lib/modo-datos";
import type { ResetTokenRegistro, ResetTokenRepo } from "@/modules/identidad/domain/reset-password";

const memoria = new Map<string, ResetTokenRegistro>();

const tokensSimulados: ResetTokenRepo = {
  async guardar(reg) {
    memoria.set(reg.tokenHash, { ...reg, usadoEn: reg.usadoEn ?? null });
  },
  async buscarPorHash(tokenHash) {
    return memoria.get(tokenHash) ?? null;
  },
  async marcarUsado(tokenHash, ahora = Date.now()) {
    const actual = memoria.get(tokenHash);
    if (actual) memoria.set(tokenHash, { ...actual, usadoEn: ahora });
  },
  async invalidarDeCliente(clienteId) {
    for (const [k, v] of memoria) {
      if (v.clienteId === clienteId && v.usadoEn === null) {
        memoria.set(k, { ...v, usadoEn: Date.now() });
      }
    }
  },
};

type FilaToken = {
  token_hash: string;
  cliente_id: string;
  expira_en: string | number;
  usado_en: string | number | null;
};

const tokensPg: ResetTokenRepo = {
  async guardar(reg) {
    await query(
      `insert into public.reset_password_tokens (token_hash, cliente_id, expira_en, usado_en)
       values ($1, $2, to_timestamp($3 / 1000.0), null)
       on conflict (token_hash) do update
         set cliente_id = excluded.cliente_id,
             expira_en = excluded.expira_en,
             usado_en = null`,
      [reg.tokenHash, reg.clienteId, reg.expiraEn],
    );
  },
  async buscarPorHash(tokenHash) {
    const rows = await query<FilaToken>(
      `select token_hash, cliente_id, (extract(epoch from expira_en) * 1000)::bigint as expira_en,
              case when usado_en is null then null else (extract(epoch from usado_en) * 1000)::bigint end as usado_en
       from public.reset_password_tokens where token_hash = $1`,
      [tokenHash],
    );
    const row = rows[0];
    if (!row) return null;
    return {
      tokenHash: row.token_hash,
      clienteId: row.cliente_id,
      expiraEn: Number(row.expira_en),
      usadoEn: row.usado_en == null ? null : Number(row.usado_en),
    };
  },
  async marcarUsado(tokenHash, ahora = Date.now()) {
    await query(
      `update public.reset_password_tokens set usado_en = to_timestamp($2 / 1000.0) where token_hash = $1`,
      [tokenHash, ahora],
    );
  },
  async invalidarDeCliente(clienteId) {
    await query(
      `update public.reset_password_tokens set usado_en = now()
       where cliente_id = $1 and usado_en is null`,
      [clienteId],
    );
  },
};

export function resetTokensRepo(): ResetTokenRepo {
  return usarSimulacion() ? tokensSimulados : tokensPg;
}

/** Solo tests. */
export function limpiarTokensSimulados() {
  memoria.clear();
}
