import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { ListaComprasRepo } from "@/modules/operacion/application/puertos";
import { registrarVentaManual } from "@/modules/pedidos/application/registrar-venta-manual";
import type { PedidosRepo } from "@/modules/pedidos/application/puertos";
import type { Pedido } from "@/modules/pedidos/domain/types";
import type { DatosTienda, TiendaRepo } from "@/modules/tienda/application/puertos";

const catalogo = [{ slug: "RM-27T", nombre: "Real Madrid Titular", precio: 130000, personalizable: true }];

const body = {
  canal: "WhatsApp",
  modoPago: "abono",
  nombre: "Camila Rojas",
  telefono: "300 555 1234",
  ciudad: "Medellín",
  direccion: "Cra 45 # 12-30",
  items: [{ slug: "RM-27T", talla: "M", manga: "Corta", personalizacion: "Sin personalización", cantidad: 1 }],
};

function pedidosFake(): PedidosRepo & { guardados: Pedido[] } {
  const guardados: Pedido[] = [];
  return {
    guardados,
    async listarTodos() {
      return [...guardados];
    },
    async listarPorCliente() {
      return [];
    },
    async buscar() {
      return null;
    },
    async guardar(p) {
      guardados.push(p);
    },
  };
}

function tiendaFake(): TiendaRepo & { ventas: unknown[] } {
  const ventas: unknown[] = [];
  const datos: DatosTienda = { productos: [], ligas: [], promociones: [], cupones: [], banners: [] };
  return {
    ventas,
    async leer() {
      return datos;
    },
    async guardar() {},
    async registrarVenta(items, cuponId) {
      ventas.push({ items, cuponId });
    },
    async imagen() {
      return null;
    },
    async guardarImagen() {},
    async borrarImagen() {},
  };
}

function listaFake(fallar = false): ListaComprasRepo & { pedidos: Pedido[]; errores: unknown[] } {
  const pedidos: Pedido[] = [];
  const errores: unknown[] = [];
  return {
    pedidos,
    errores,
    async listar() {
      return [];
    },
    async cambiarEstado() {
      throw new Error("no");
    },
    async registrarFaltantes(p) {
      if (fallar) throw new Error("lista caída");
      pedidos.push(p);
      return 2;
    },
  };
}

describe("registrarVentaManual", () => {
  it("guarda el pedido, registra faltantes y descuenta stock", async () => {
    const pedidos = pedidosFake();
    const tienda = tiendaFake();
    const lista = listaFake();
    const r = await registrarVentaManual(body, {
      pedidos,
      tienda,
      listaCompras: lista,
      catalogo,
      ahora: new Date("2026-10-16T12:00:00Z"),
      claveAcceso: "clave-demo",
    });
    assert.equal(pedidos.guardados.length, 1);
    assert.equal(lista.pedidos.length, 1);
    assert.equal(tienda.ventas.length, 1);
    assert.equal(r.enListaDeCompras, 2);
    assert.equal(r.pedido.estado, "Alistamiento");
    assert.equal("claveAcceso" in r.pedido, false);
  });

  it("sigue descontando stock si fallan los faltantes", async () => {
    const pedidos = pedidosFake();
    const tienda = tiendaFake();
    const lista = listaFake(true);
    const r = await registrarVentaManual(body, {
      pedidos,
      tienda,
      listaCompras: lista,
      catalogo,
      ahora: new Date("2026-10-16T12:00:00Z"),
      claveAcceso: "clave-demo",
      onFaltantesError: (err) => lista.errores.push(err),
    });
    assert.equal(r.enListaDeCompras, 0);
    assert.equal(lista.errores.length, 1);
    assert.equal(tienda.ventas.length, 1);
    assert.equal(pedidos.guardados.length, 1);
  });
});
