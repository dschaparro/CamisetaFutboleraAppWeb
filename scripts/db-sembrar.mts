// Carga en Supabase los datos iniciales: tienda (ligas, productos, ofertas, cupones, banners),
// cuentas de prueba (personal + la clienta Laura con direcciones y tarjeta) y pedidos de ejemplo.
// Se puede correr varias veces: no duplica cuentas y reemplaza lo de la tienda por los datos iniciales.
// Uso: npm run db:sembrar
import { INVENTORY } from "@/data/inventory";
import { SHOPPING_LIST } from "@/data/shoppingList";
import { pool, query } from "@/lib/db";
import { datosIniciales } from "@/modules/tienda/infrastructure/repositorio";
import { tiendaPg } from "@/modules/tienda/infrastructure/repositorio-pg";
import { clientesPg } from "@/modules/identidad/infrastructure/repositorios-pg";
import { CLIENTE_DEMO_ID, perfilesIniciales, sembrar } from "@/modules/identidad/infrastructure/simulacion";
import { pedidosDeEjemplo } from "@/modules/pedidos/infrastructure/repositorios";
import { pedidosPg } from "@/modules/pedidos/infrastructure/pedidos-pg";

const datos = datosIniciales();
for (const coleccion of ["ligas", "productos", "promociones", "cupones", "banners"] as const) {
  await tiendaPg.guardar(coleccion, datos[coleccion] as never);
  console.log(`✓ ${coleccion}: ${datos[coleccion].length}`);
}

const cuentas = await sembrar();
for (const u of cuentas.usuarios) {
  await query(
    "insert into public.usuarios (email, nombre, rol, password_hash) values ($1, $2, $3, $4) on conflict (email) do nothing",
    [u.email, u.nombre, u.rol, u.passwordHash],
  );
}
console.log(`✓ usuarios del panel: ${cuentas.usuarios.length}`);

const laura = cuentas.clientes.find((c) => c.id === CLIENTE_DEMO_ID)!;
await query(
  "insert into public.clientes (email, nombre, telefono, password_hash) values ($1, $2, $3, $4) on conflict (email) do nothing",
  [laura.email, laura.nombre, laura.telefono, laura.passwordHash],
);
const lauraId = (await clientesPg.findByEmail(laura.email))!.id;
await clientesPg.guardarPerfil(lauraId, perfilesIniciales().get(CLIENTE_DEMO_ID)!);
console.log("✓ cliente de prueba con direcciones y tarjeta");

for (const p of pedidosDeEjemplo()) {
  await pedidosPg.guardar({ ...p, clienteId: p.clienteId === CLIENTE_DEMO_ID ? lauraId : p.clienteId });
}
console.log(`✓ pedidos de ejemplo: ${pedidosDeEjemplo().length}`);

// Proveedor de cada producto (el SKU del inventario es CF-<id>).
for (const i of INVENTORY) await query("update public.productos set proveedor = $2 where id = $1", [i.sku.replace(/^CF-/, ""), i.prov]);
console.log("✓ proveedores de los productos");

// Historial de compras y lista de compras de ejemplo: solo si están vacíos (no se duplican al repetir).
if (Number((await query("select count(*) as n from public.compras"))[0].n) === 0) {
  for (const i of INVENTORY) {
    await query(
      "insert into public.compras (producto_id, producto, proveedor, cantidad, costo_unitario, nota) values ($1,$2,$3,$4,$5,'Compra de ejemplo')",
      [i.sku.replace(/^CF-/, ""), i.name, i.prov, i.stock + 8, i.cost],
    );
  }
  await query("insert into public.compras (producto, proveedor, cantidad, costo_unitario, nota) values ('Estampado de dorsales (DTF)', 'Estampados DTF Bogotá', 40, 10750, 'Compra de ejemplo')");
  console.log(`✓ compras de ejemplo: ${INVENTORY.length + 1}`);
}
if (Number((await query("select count(*) as n from public.lista_compras"))[0].n) === 0) {
  for (const i of SHOPPING_LIST) {
    await query(
      "insert into public.lista_compras (producto, variante, personalizacion, origen, estado, nota) values ($1,$2,$3,$4,$5,$6)",
      [i.product, i.variant, i.custom, i.origin, i.status, i.note ?? null],
    );
  }
  console.log(`✓ lista de compras de ejemplo: ${SHOPPING_LIST.length}`);
}

await pool().end();
