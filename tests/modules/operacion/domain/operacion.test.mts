import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  OperacionInvalidaError,
  estadoStock,
  faltantes,
  margenPct,
  validarCambioLista,
  validarCambiosInventario,
  validarCompra,
} from "@/modules/operacion/domain/operacion";

const linea = (slug: string, cantidad: number) => ({ slug, nombre: slug, talla: "M", manga: "Corta", personalizacion: "Sin personalización", cantidad });

describe("inventario", () => {
  it("calcula el margen sobre el precio y no inventa uno sin costo", () => {
    assert.equal(margenPct(130000, 78000), 40);
    assert.equal(margenPct(130000, null), null);
  });

  it("clasifica el stock", () => {
    assert.equal(estadoStock(0), "agotado");
    assert.equal(estadoStock(5), "bajo");
    assert.equal(estadoStock(6), "ok");
  });

  it("valida cambios: costo vacío = pendiente, stock entero no negativo", () => {
    assert.deepEqual(validarCambiosInventario({ costo: "", proveedor: "  Importfut " }), { costo: null, proveedor: "Importfut" });
    assert.throws(() => validarCambiosInventario({ stock: -1 }), OperacionInvalidaError);
    assert.throws(() => validarCambiosInventario({ stock: 2.5 }), OperacionInvalidaError);
    assert.throws(() => validarCambiosInventario({}), OperacionInvalidaError);
  });

  it("valida la compra y rechaza cantidades o proveedor inválidos", () => {
    const ok = validarCompra({ productoId: "RM-27T", cantidad: "5", costoUnitario: 78000, proveedor: "Distrideportes", listaId: "3" });
    assert.equal(ok.cantidad, 5);
    assert.equal(ok.listaId, 3);
    assert.throws(() => validarCompra({ productoId: "RM-27T", cantidad: 0, costoUnitario: 1, proveedor: "X" }), OperacionInvalidaError);
    try {
      validarCompra({ cantidad: 1, costoUnitario: -5, proveedor: "" });
    } catch (e) {
      assert.deepEqual(Object.keys((e as OperacionInvalidaError).campos).sort(), ["costoUnitario", "productoId", "proveedor"]);
    }
  });

  it("valida el estado de la lista de compras", () => {
    assert.deepEqual(validarCambioLista({ estado: "Conseguido", nota: " ok " }), { estado: "Conseguido", nota: "ok" });
    assert.throws(() => validarCambioLista({ estado: "Perdido" }), OperacionInvalidaError);
  });
});

describe("faltantes (lista de compras automática)", () => {
  it("no genera nada si hay stock suficiente", () => {
    assert.deepEqual(faltantes([linea("RM", 2)], new Map([["RM", 5]])), []);
  });

  it("agrega solo lo que no alcanza", () => {
    const f = faltantes([linea("RM", 3)], new Map([["RM", 1]]));
    assert.equal(f.length, 1);
    assert.equal(f[0].cantidad, 2);
    assert.equal(f[0].variante, "M · manga corta");
  });

  it("reparte el stock entre las líneas del mismo producto en orden", () => {
    const f = faltantes([linea("RM", 2), linea("RM", 2)], new Map([["RM", 3]]));
    assert.deepEqual(f.map((x) => x.cantidad), [1]);
  });

  it("un producto agotado va completo a la lista y un id desconocido se ignora", () => {
    const f = faltantes([linea("FCB", 2), linea("???", 1)], new Map([["FCB", 0]]));
    assert.deepEqual(f.map((x) => [x.slug, x.cantidad]), [["FCB", 2]]);
  });
});
