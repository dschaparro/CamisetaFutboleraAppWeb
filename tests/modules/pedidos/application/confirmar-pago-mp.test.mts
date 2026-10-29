import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { confirmarPagoPorIdMp } from "@/modules/pedidos/application/confirmar-pago-mp";
import type { MercadoPagoCliente, PedidosRepo } from "@/modules/pedidos/application/puertos";
import type { Pedido } from "@/modules/pedidos/domain/types";

const base: Pedido = {
  id: "CF-00999",
  clienteId: null,
  claveAcceso: "clave",
  contacto: { nombre: "Ana", email: "ana@demo.co", telefono: "300" },
  creadoEn: "2026-10-16T12:00:00Z",
  estado: "Pendiente de pago",
  historial: [{ estado: "Pendiente de pago", fecha: "2026-10-16T12:00:00Z" }],
  medioPago: "Tarjeta / PSE / Nequi (Mercado Pago)",
  estadoPago: "Pendiente",
  ciudad: "Bogotá",
  direccion: "Cra 1",
  items: [{ nombre: "X", slug: "x", talla: "M", manga: "Corta", personalizacion: "Sin personalización", cantidad: 1, precioUnitario: 100000 }],
  subtotal: 100000,
  envio: 18000,
  descuento: 0,
  total: 118000,
  guia: null,
};

function repoFake(inicial: Pedido): PedidosRepo & { pedido: Pedido } {
  const box = { pedido: { ...inicial, historial: [...inicial.historial] } };
  return {
    get pedido() {
      return box.pedido;
    },
    async listarTodos() {
      return [box.pedido];
    },
    async listarPorCliente() {
      return [];
    },
    async buscar(id) {
      return id === box.pedido.id ? box.pedido : null;
    },
    async guardar(p) {
      box.pedido = p;
    },
  };
}

function mpFake(status: string): MercadoPagoCliente {
  return {
    async crearPreferenciaCheckout() {
      return { id: "pref", redirectUrl: "https://mp.example/checkout" };
    },
    async obtenerPago(paymentId) {
      return {
        id: Number(paymentId),
        status,
        external_reference: "CF-00999",
      };
    },
  };
}

describe("confirmarPagoPorIdMp", () => {
  it("aprueba el pedido cuando el pago MP está approved", async () => {
    const repo = repoFake(base);
    const r = await confirmarPagoPorIdMp("55", {
      pedidos: repo,
      mp: mpFake("approved"),
      ahora: new Date("2026-10-16T13:00:00Z"),
    });
    assert.equal(r.pago.aprobado, true);
    assert.equal(r.pedido?.estado, "Alistamiento");
    assert.equal(r.pedido?.estadoPago, "Pagado");
    assert.match(r.pago.referencia, /^MP-55$/);
  });
});
