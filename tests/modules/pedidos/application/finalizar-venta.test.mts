import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { finalizarVenta } from "@/modules/pedidos/application/finalizar-venta";
import type { PedidosRepo } from "@/modules/pedidos/application/puertos";
import type { Pedido } from "@/modules/pedidos/domain/types";
import type { ListaComprasRepo } from "@/modules/operacion/application/puertos";
import type { DatosTienda, TiendaRepo } from "@/modules/tienda/application/puertos";

const catalogo = [{ slug: "RM-27T", nombre: "Real Madrid Titular", precio: 130000, personalizable: true }];

const body = {
  nombre: "Laura",
  email: "laura@demo.co",
  telefono: "3001234567",
  ciudad: "Bogotá",
  direccion: "Cra 1 # 2-3",
  medioPago: "pasarela",
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
  const datos: DatosTienda = {
    productos: [],
    ligas: [],
    promociones: [],
    cupones: [],
    banners: [],
  };
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

function listaFake(): ListaComprasRepo & { pedidos: Pedido[] } {
  const pedidos: Pedido[] = [];
  return {
    pedidos,
    async listar() {
      return [];
    },
    async cambiarEstado() {
      throw new Error("no");
    },
    async registrarFaltantes(p) {
      pedidos.push(p);
      return 1;
    },
  };
}

describe("finalizarVenta", () => {
  it("crea el pedido, registra faltantes y descuenta stock", async () => {
    const pedidos = pedidosFake();
    const tienda = tiendaFake();
    const lista = listaFake();
    const pedido = await finalizarVenta(body, "", {
      pedidos,
      tienda,
      listaCompras: lista,
      catalogo,
      clienteId: "cli-1",
      ahora: new Date("2026-10-16T12:00:00Z"),
      claveAcceso: "clave-demo",
    });
    assert.equal(pedidos.guardados.length, 1);
    assert.equal(lista.pedidos.length, 1);
    assert.equal(tienda.ventas.length, 1);
    assert.equal(pedido.clienteId, "cli-1");
    assert.equal(pedido.items[0]?.slug, "RM-27T");
  });
});
