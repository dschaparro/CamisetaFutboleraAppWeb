import pg from "pg";

/**
 * Conexión a PostgreSQL (Supabase) solo desde el servidor, con DATABASE_URL.
 * Se usa el pooler de Supabase en modo sesión (IPv4). Un único pool por proceso,
 * guardado en globalThis para no abrir conexiones nuevas en cada recarga de `npm run dev`.
 */
const global = globalThis as typeof globalThis & { __cfPool?: pg.Pool };

export function pool(): pg.Pool {
  if (!global.__cfPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) throw new Error("Falta DATABASE_URL en .env.local");
    global.__cfPool = new pg.Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30_000,
    });
  }
  return global.__cfPool;
}

export async function query<T extends pg.QueryResultRow = pg.QueryResultRow>(sql: string, params: unknown[] = []): Promise<T[]> {
  return (await pool().query<T>(sql, params)).rows;
}

/** Ejecuta varias operaciones como una sola: o se guardan todas o ninguna. */
export async function transaccion<T>(fn: (c: pg.PoolClient) => Promise<T>): Promise<T> {
  const c = await pool().connect();
  try {
    await c.query("begin");
    const r = await fn(c);
    await c.query("commit");
    return r;
  } catch (e) {
    await c.query("rollback").catch(() => {});
    throw e;
  } finally {
    c.release();
  }
}

/** Código de Postgres para «valor duplicado» (unique). */
export function esDuplicado(e: unknown): boolean {
  return typeof e === "object" && e !== null && (e as { code?: string }).code === "23505";
}
