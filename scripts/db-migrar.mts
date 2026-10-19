// Aplica las migraciones de supabase/migrations/ en orden contra DATABASE_URL.
// Uso: npm run db:migrar
import { readdirSync, readFileSync } from "node:fs";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Falta DATABASE_URL en .env.local");

const carpeta = "supabase/migrations";
const archivos = readdirSync(carpeta).filter((f) => f.endsWith(".sql")).sort();
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();
try {
  for (const f of archivos) {
    await client.query("begin");
    await client.query(readFileSync(`${carpeta}/${f}`, "utf8"));
    await client.query("commit");
    console.log(`✓ ${f}`);
  }
  const t = await client.query("select table_name from information_schema.tables where table_schema = 'public' order by 1");
  console.log("Tablas:", t.rows.map((r) => r.table_name).join(", "));
} catch (e) {
  await client.query("rollback").catch(() => {});
  throw e;
} finally {
  await client.end();
}
