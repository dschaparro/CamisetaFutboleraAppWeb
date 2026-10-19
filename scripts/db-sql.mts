// Ejecuta SQL directamente en la base de Supabase (DATABASE_URL).
// Uso:
//   npm run db:sql -- "select * from productos"          (una sentencia)
//   npm run db:sql -- archivo.sql                          (un archivo con varias sentencias)
//   npm run db:sql                                         (consola interactiva: termina cada sentencia con ; y sal con .salir)
// Cuidado: esto escribe en la base real; no hay deshacer.
import { existsSync, readFileSync } from "node:fs";
import { createInterface } from "node:readline/promises";
import pg from "pg";

const url = process.env.DATABASE_URL;
if (!url) throw new Error("Falta DATABASE_URL en .env.local");
const client = new pg.Client({ connectionString: url, ssl: { rejectUnauthorized: false } });
await client.connect();

function mostrar(r: pg.QueryResult | pg.QueryResult[]) {
  for (const x of Array.isArray(r) ? r : [r]) {
    if (x.rows.length > 0) console.table(x.rows);
    else console.log(`${x.command ?? "OK"}${x.rowCount !== null ? ` · ${x.rowCount} fila(s)` : ""}`);
  }
}

async function ejecutar(sql: string) {
  try {
    mostrar(await client.query(sql));
  } catch (e) {
    console.error("Error:", e instanceof Error ? e.message : e);
  }
}

const arg = process.argv.slice(2).join(" ").trim();
if (arg) {
  await ejecutar(existsSync(arg) ? readFileSync(arg, "utf8") : arg);
} else {
  const rl = createInterface({ input: process.stdin, output: process.stdout, prompt: "sql> " });
  console.log("Consola SQL de Supabase. Termina cada sentencia con ; · .tablas lista las tablas · .salir termina.");
  let buffer = "";
  rl.prompt();
  for await (const linea of rl) {
    const t = linea.trim();
    if (t === ".salir") break;
    if (t === ".tablas") await ejecutar("select table_name from information_schema.tables where table_schema = 'public' order by 1");
    else {
      buffer += `${linea}\n`;
      if (buffer.trimEnd().endsWith(";")) {
        await ejecutar(buffer);
        buffer = "";
      }
    }
    rl.setPrompt(buffer ? "  -> " : "sql> ");
    rl.prompt();
  }
  rl.close();
}
await client.end();
