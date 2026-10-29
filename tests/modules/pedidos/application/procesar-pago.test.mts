import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { PedidosRepo, Pasarela } from "@/modules/pedidos/application/puertos";
import { PedidoNoVisibleError, procesarPagoPedido } from "@/modules/pedidos/application/procesar-pago";
import { PagoNoPermitidoError } from "@/modules/pedidos/domain/pedido";
import type { Pedido } from "@/modules/pedidos/domain/types";

function pedidoBase(over: Partial<Pedido> = {}): Pedido {
  return {
    id: "CF-00900",
    clienteId: "cli-1",
    claveAcceso: "clave",
    contacto: { nombre: "Laura", email: "a@x.co", telefono: "300" },
    ciudad: "Bogotá",
    direccion: "Cra 1",
    creadoEn: "2026-10-16T12:00:00.000Z",
    estado: "Pendiente de pago",
    historial: [],
    items: [],
    medioPago: "Tarjeta / PSE (Wompi)",
    estadoPago: "Pendiente",
    guia: null,
    subtotal: 100000,
    envio: 18000,
    descuento: 0,
    total: 118000,
    ...over,
  };
}

function repoCon(p: Pedido): PedidosRepo {
  let actual = p;
  return {
    async listarTodos() {
      return [actual];
    },
    async listarPorCliente() {
      return [actual];
    },
    async buscar(id) {
      return id === actual.id ? actual : null;
    },
    async guardar(pedido) {
      actual = pedido;
    },
  };
}

const pasarelaOk: Pasarela = {
  async cobrarDesdeBody() {
    return { aprobado: true, referencia: "SIM-1", mensaje: "ok" };
  },
};

describe("procesarPagoPedido", () => {
  it("cobra y deja el pedido en Alistamiento", async () => {
    const pedidos = repoCon(pedidoBase());
    const { pedido, pago } = await procesarPagoPedido("CF-00900", {}, {
      pedidos,
      pasarela: pasarelaOk,
      clave: "clave",
      clienteId: null,
      tarjetas: [],
      ahora: new Date("2026-10-16T12:05:00Z"),
    });
    assert.equal(pago.aprobado, true);
    assert.equal(pedido.estado, "Alistamiento");
  });

  it("rechaza si no puede ver el pedido", async () => {
    await assert.rejects(
      procesarPagoPedido("CF-00900", {}, {
        pedidos: repoCon(pedidoBase()),
        pasarela: pasarelaOk,
        clave: "mala",
        clienteId: null,
        tarjetas: [],
        ahora: new Date(),
      }),
      PedidoNoVisibleError,
    );
  });

  it("rechaza si ya no está pendiente de pago", async () => {
    await assert.rejects(
      procesarPagoPedido("CF-00900", {}, {
        pedidos: repoCon(pedidoBase({ estado: "Alistamiento", estadoPago: "Pagado" })),
        pasarela: pasarelaOk,
        clave: "clave",
        clienteId: null,
        tarjetas: [],
        ahora: new Date(),
      }),
      PagoNoPermitidoError,
    );
  });
});
