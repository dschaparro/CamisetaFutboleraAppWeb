import { INVENTORY } from "@/data/inventory";
import { ORDERS } from "@/data/orders";
import { PRODUCTS } from "@/data/products";
import { SHOPPING_LIST } from "@/data/shoppingList";
import type { FuentesNegocio } from "@/modules/ia/domain/contexto";

/**
 * Adaptador temporal: arma las fuentes del informe con los datos de ejemplo.
 * Cuando cada módulo persista en Supabase, se reemplaza aquí (una sola función)
 * y se cambia `fuente` a "sistema"; el resto del módulo no se toca.
 */
export function fuentesDeEjemplo(): FuentesNegocio {
  return {
    fuente: "ejemplo",
    pedidos: ORDERS.map((o) => ({
      id: o.id,
      items: o.items,
      total: o.total,
      pago: o.pay,
      estado: o.status,
    })),
    inventario: INVENTORY.map((p) => ({
      nombre: p.name,
      sku: p.sku,
      proveedor: p.prov,
      costo: p.cost,
      precio: p.price,
      stock: p.stock,
    })),
    listaCompras: SHOPPING_LIST.map((i) => ({
      producto: i.product,
      variante: i.variant,
      origen: i.origin,
      estado: i.status,
    })),
    catalogo: PRODUCTS.map((p) => ({
      club: p.club,
      categoria: p.cat,
      retro: p.retro === true,
    })),
  };
}
