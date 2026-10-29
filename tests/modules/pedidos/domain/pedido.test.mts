import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  armarPedido,
  cambiarEstado,
  ENVIO_COP,
  montoACobrar,
  PagoNoPermitidoError,
  PedidoInvalidoError,
  registrarPago,
  siguienteId,
  TransicionInvalidaError,
  validarPedidoNuevo,
} from "@/modules/pedidos/domain/pedido";
import type { ProductoVenta } from "@/modules/pedidos/domain/types";

const CATALOGO: ProductoVenta[] = [
  { slug: "RM-27T", nombre: "Camiseta Real Madrid Titular 2026/27", precio: 130000, personalizable: true },
  { slug: "BAY-99R", nombre: "Camiseta Bayern Munich Retro 1999", precio: 120000, personalizable: false },
];
const AHORA = new Date("2026-10-05T15:00:00.000Z");

const BASE = {
  nombre: "Laura Ramírez",
  email: "LAURA@demo.co",
  telefono: "+57 300 123 4567",
  direccion: "Cra 45 # 12-30",
  ciudad: "Bogotá",
  medioPago: "pasarela",
  items: [
    { slug: "RM-27T", talla: "M", manga: "Corta", personalizacion: '"RAMÍREZ" #7', cantidad: 2, precioUnitario: 1 },
    { slug: "BAY-99R", talla: "L", manga: "Larga", personalizacion: "intento", cantidad: 1 },
  ],
};

function campos(fn: () => unknown): Record<string, string> {
  try {
    fn();
  } catch (e) {
    assert.ok(e instanceof PedidoInvalidoError);
    return e.campos;
  }
  assert.fail("debía fallar");
}

describe("validarPedidoNuevo", () => {
  it("toma precio y nombre del catálogo, no del navegador", () => {
    const d = validarPedidoNuevo(BASE, CATALOGO);
    assert.equal(d.items[0].precioUnitario, 130000);
    assert.equal(d.items[0].nombre, "Camiseta Real Madrid Titular 2026/27");
  });

  it("limpia contacto y descarta personalización en productos no personalizables", () => {
    const d = validarPedidoNuevo(BASE, CATALOGO);
    assert.equal(d.contacto.email, "laura@demo.co");
    assert.equal(d.contacto.telefono, "3001234567");
    assert.equal(d.items[1].personalizacion, "Sin personalización");
  });

  it("rechaza productos inexistentes, cantidades raras y carrito vacío", () => {
    assert.ok(campos(() => validarPedidoNuevo({ ...BASE, items: [{ ...BASE.items[0], slug: "NO-EXISTE" }] }, CATALOGO)).items);
    assert.ok(campos(() => validarPedidoNuevo({ ...BASE, items: [{ ...BASE.items[0], cantidad: 0 }] }, CATALOGO)).items);
    assert.ok(campos(() => validarPedidoNuevo({ ...BASE, items: [{ ...BASE.items[0], talla: "XXL" }] }, CATALOGO)).items);
    assert.ok(campos(() => validarPedidoNuevo({ ...BASE, items: [] }, CATALOGO)).items);
  });

  it("reporta todos los datos de envío faltantes", () => {
    const c = campos(() => validarPedidoNuevo({ ...BASE, nombre: "", email: "x", telefono: "1", direccion: "", ciudad: "", medioPago: "bitcoin" }, CATALOGO));
    assert.deepEqual(Object.keys(c).sort(), ["ciudad", "direccion", "email", "medioPago", "nombre", "telefono"]);
  });
});

describe("armarPedido y pagos", () => {
  const datos = validarPedidoNuevo(BASE, CATALOGO);

  it("calcula subtotal, envío y total en el servidor", () => {
    const p = armarPedido(datos, "CF-00900", null, AHORA, "clave");
    assert.equal(p.subtotal, 380000);
    assert.equal(p.envio, ENVIO_COP);
    assert.equal(p.total, 380000 + ENVIO_COP);
  });

  it("pago en línea queda pendiente; contra entrega pasa directo a alistamiento", () => {
    assert.equal(armarPedido(datos, "CF-1", null, AHORA, "k").estado, "Pendiente de pago");
    const ce = armarPedido({ ...datos, medioPago: "contraentrega" }, "CF-2", null, AHORA, "k");
    assert.equal(ce.estado, "Alistamiento");
    assert.equal(ce.estadoPago, "Pendiente");
  });

  it("el abono cobra el 50 % y queda como «Abono 50%» al aprobarse", () => {
    const p = armarPedido({ ...datos, medioPago: "abono" }, "CF-3", null, AHORA, "k");
    assert.equal(montoACobrar(p), Math.round(p.total / 2));
    const pagado = registrarPago(p, true, "SIM-1", AHORA);
    assert.equal(pagado.estado, "Alistamiento");
    assert.equal(pagado.estadoPago, "Abono 50%");
  });

  it("un pago rechazado deja el pedido pendiente y anota el intento; no se paga dos veces", () => {
    const p = armarPedido(datos, "CF-4", null, AHORA, "k");
    const rechazado = registrarPago(p, false, "SIM-2", AHORA);
    assert.equal(rechazado.estado, "Pendiente de pago");
    assert.match(rechazado.historial.at(-1)!.nota!, /rechazado/);
    const aprobado = registrarPago(rechazado, true, "SIM-3", AHORA);
    assert.equal(aprobado.estadoPago, "Pagado");
    assert.throws(() => registrarPago(aprobado, true, "SIM-4", AHORA), PagoNoPermitidoError);
  });
});

describe("estados", () => {
  const p = armarPedido({ ...validarPedidoNuevo(BASE, CATALOGO), medioPago: "contraentrega" }, "CF-5", null, AHORA, "k");

  it("sigue el flujo alistamiento → enviado (con guía) → entregado y marca pagado al entregar", () => {
    const enviado = cambiarEstado(p, "Enviado", AHORA, " SERVI-123 ");
    assert.equal(enviado.guia, "SERVI-123");
    const entregado = cambiarEstado(enviado, "Entregado", AHORA);
    assert.equal(entregado.estadoPago, "Pagado");
    assert.equal(entregado.historial.at(-1)!.estado, "Entregado");
  });

  it("no permite saltos ni cambios en pedidos terminados", () => {
    assert.throws(() => cambiarEstado(p, "Entregado", AHORA), TransicionInvalidaError);
    const cancelado = cambiarEstado(p, "Cancelado", AHORA);
    assert.throws(() => cambiarEstado(cancelado, "Alistamiento", AHORA), TransicionInvalidaError);
  });

  it("siguienteId continúa la numeración", () => {
    assert.equal(siguienteId(["CF-00842", "CF-00765", "otro"]), "CF-00843");
    assert.equal(siguienteId([]), "CF-00001");
  });
});
