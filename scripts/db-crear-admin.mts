// Crea (o actualiza) una cuenta del personal con una contraseña aleatoria y la imprime una sola vez.
// Uso: npm run db:crear-admin -- correo@dominio.com "Nombre Completo" [Rol]
import { randomBytes } from "node:crypto";
import { pool, query } from "@/lib/db";
import { hashPassword } from "@/modules/identidad/domain/password";
import { esRol } from "@/modules/identidad/domain/types";

const [email, nombre = "Superadministrador", rol = "Administrador"] = process.argv.slice(2);
if (!email) throw new Error('Uso: npm run db:crear-admin -- correo@dominio.com "Nombre" [Rol]');
if (!esRol(rol)) throw new Error(`Rol inválido: ${rol}`);

// 18 caracteres sin símbolos ambiguos (0/O, 1/l/I) para que se pueda escribir sin errores.
const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
const bytes = randomBytes(18);
const password = Array.from(bytes, (b) => ALFABETO[b % ALFABETO.length]).join("") + "!7";

await query(
  `insert into public.usuarios (email, nombre, rol, password_hash) values ($1, $2, $3, $4)
   on conflict (email) do update set nombre = excluded.nombre, rol = excluded.rol, password_hash = excluded.password_hash, activo = true`,
  [email.trim().toLowerCase(), nombre, rol, await hashPassword(password)],
);
console.log(`Cuenta: ${email.trim().toLowerCase()}  (${rol})\nContraseña: ${password}`);
await pool().end();
