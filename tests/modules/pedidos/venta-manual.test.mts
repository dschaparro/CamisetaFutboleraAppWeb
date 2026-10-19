import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { PedidoInvalidoError } from "@/modules/pedidos/domain/pedido";
import { armarVentaManual, validarVentaManual } from "@/modules/pedidos/domain/venta-manual";

const catalogo = [{ slug: "RM-27T", nombre: "Real Madrid Titular", precio: 130000, personalizable: true }];
const base = {
  canal: "WhatsApp",
  modoPago: "abono",
  nombre: "Camila Rojas",
  telefono: "300 555 1234",
  ciudad: "Medellín",
  direccion: "Cra 45 # 12-30",
  items: [{ slug: "RM-27T", talla: "M", manga: "Corta", personalizacion: "MARTÍNEZ 7", cantidad: 2, precio: 1 }],
};

describe("venta manual", () => {
  it("entra a Alistamiento con el estado de pago acordado y precios del catálogo", () => {
    const v = validarVentaManual(base, catalogo);
    const p = armarVentaManual(v, "CF-00900", new Date("2026-10-16T10:00:00Z"), "clave");
    assert.equal(p.estado, "Alistamiento");
    assert.equal(p.estadoPago, "Abono 50%");
    assert.equal(p.canal, "WhatsApp");
    assert.equal(p.subtotal, 260000);
    assert.equal(p.total, 278000);
    assert.equal(p.contacto.email, "");
    assert.equal(p.clienteId, null);
  });

  it("en el punto físico no se cobra envío ni se pide dirección", () => {
    const v = validarVentaManual({ ...base, canal: "Punto físico", modoPago: "anticipado", ciudad: "", direccion: "" }, catalogo);
    const p = armarVentaManual(v, "CF-00901", new Date(), "clave");
    assert.equal(p.envio, 0);
    assert.equal(p.total, 260000);
    assert.equal(p.estadoPago, "Pagado");
  });

  it("rechaza canal, pago o cédula inválidos y productos que no existen", () => {
    assert.throws(() => validarVentaManual({ ...base, canal: "Telegram" }, catalogo), PedidoInvalidoError);
    assert.throws(() => validarVentaManual({ ...base, modoPago: "cripto" }, catalogo), PedidoInvalidoError);
    assert.throws(() => validarVentaManual({ ...base, documento: "12ab" }, catalogo), PedidoInvalidoError);
    assert.throws(() => validarVentaManual({ ...base, items: [{ ...base.items[0], slug: "NO-EXISTE" }] }, catalogo), PedidoInvalidoError);
  });

  it("si el correo viene, debe ser válido", () => {
    assert.throws(() => validarVentaManual({ ...base, email: "no-es-correo" }, catalogo), PedidoInvalidoError);
    assert.equal(validarVentaManual({ ...base, email: "camila@correo.co" }, catalogo).datos.contacto.email, "camila@correo.co");
  });
});
