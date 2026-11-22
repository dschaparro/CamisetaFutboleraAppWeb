import pg from "pg";

/**
 * Conexión a PostgreSQL (Supabase) solo desde el servidor, con DATABASE_URL.
 * En Vercel hay que usar el pooler en modo transacción (:6543): el modo sesión
 * (:5432) se agota con ~15 clientes (EMAXCONNSESSION) bajo instancias serverless.
 * Un único pool por proceso en globalThis evita pools nuevos en cada recarga de `npm run dev`.
 */
const global = globalThis as typeof globalThis & { __cfPool?: pg.Pool };

const enVercel = Boolean(process.env.VERCEL);

/** Si en Vercel aún apunta al pooler sesión (5432), forzar transacción (6543). */
function connectionString(): string {
  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) throw new Error("Falta DATABASE_URL en el entorno");
  if (enVercel && /pooler\.supabase\.com:5432\b/i.test(raw)) {
    return raw.replace(/:5432\b/i, ":6543");
  }
  return raw;
}

export function pool(): pg.Pool {
  if (!global.__cfPool) {
    global.__cfPool = new pg.Pool({
      connectionString: connectionString(),
      ssl: { rejectUnauthorized: false },
      // Serverless: 1 conexión por instancia. Varias warm con max>1 agotan el pooler.
      max: enVercel ? 1 : 5,
      idleTimeoutMillis: enVercel ? 5_000 : 30_000,
      connectionTimeoutMillis: 10_000,
      allowExitOnIdle: enVercel,
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
