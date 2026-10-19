import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { ProductoInvalidoError } from "@/modules/catalogo/domain/errors";
import {
  estadoStock,
  margenPct,
  slugDesdeSku,
  validarCambios,
  validarProductoNuevo,
} from "@/modules/catalogo/domain/producto";

const VALIDO = {
  sku: " cf-rm-27t ",
  nombre: "Camiseta  Real Madrid Titular 2027",
  club: "Real Madrid",
  categoria: "europeo",
  precio: 130000,
  costo: 78000,
  stock: 12,
  proveedor: "Distrideportes",
  iniciales: "rm",
  personalizable: true,
  retro: false,
  etiqueta: "Nuevo",
  visible: true,
};

function camposConError(fn: () => unknown): Record<string, string> {
  try {
    fn();
  } catch (e) {
    assert.ok(e instanceof ProductoInvalidoError);
    return e.campos;
  }
  assert.fail("se esperaba ProductoInvalidoError");
}

describe("validarProductoNuevo", () => {
  it("limpia SKU, iniciales y espacios", () => {
    const p = validarProductoNuevo(VALIDO);
    assert.equal(p.sku, "CF-RM-27T");
    assert.equal(p.iniciales, "RM");
    assert.equal(p.nombre, "Camiseta Real Madrid Titular 2027");
  });

  it("pone valores por defecto a lo opcional (costo pendiente, stock 0, visible)", () => {
    const p = validarProductoNuevo({
      sku: "CF-PSG-27T",
      nombre: "Camiseta PSG Titular 2027",
      club: "Paris Saint-Germain",
      categoria: "europeo",
      precio: 130000,
      iniciales: "PSG",
    });
    assert.equal(p.costo, null);
    assert.equal(p.stock, 0);
    assert.equal(p.proveedor, null);
    assert.equal(p.etiqueta, null);
    assert.equal(p.visible, true);
    assert.equal(p.personalizable, true);
  });

  it("acepta números escritos como texto (vienen de un input)", () => {
    const p = validarProductoNuevo({ ...VALIDO, precio: "125000", stock: "3" });
    assert.equal(p.precio, 125000);
    assert.equal(p.stock, 3);
  });

  it("trata texto vacío como valor pendiente en campos opcionales", () => {
    const p = validarProductoNuevo({ ...VALIDO, costo: "", proveedor: "  ", etiqueta: "" });
    assert.equal(p.costo, null);
    assert.equal(p.proveedor, null);
    assert.equal(p.etiqueta, null);
  });

  it("reporta todos los campos con error a la vez", () => {
    const campos = camposConError(() =>
      validarProductoNuevo({ ...VALIDO, sku: "rm 27", precio: 0, stock: -1, categoria: "asiatico", etiqueta: "Oferta" }),
    );
    assert.deepEqual(Object.keys(campos).sort(), ["categoria", "etiqueta", "precio", "sku", "stock"]);
  });

  it("rechaza decimales en precio y stock", () => {
    const campos = camposConError(() => validarProductoNuevo({ ...VALIDO, precio: 1300.5, stock: 1.5 }));
    assert.ok(campos.precio);
    assert.ok(campos.stock);
  });

  it("rechaza algo que no es un objeto", () => {
    assert.throws(() => validarProductoNuevo(null), ProductoInvalidoError);
    assert.throws(() => validarProductoNuevo([]), ProductoInvalidoError);
  });
});

describe("validarCambios", () => {
  it("valida solo los campos enviados", () => {
    assert.deepEqual(validarCambios({ precio: 120000, visible: false }), { precio: 120000, visible: false });
  });

  it("permite dejar el costo como pendiente", () => {
    assert.deepEqual(validarCambios({ costo: null }), { costo: null });
  });

  it("no permite cambiar el SKU", () => {
    assert.ok(camposConError(() => validarCambios({ sku: "CF-OTRO" })).sku);
  });

  it("rechaza un cambio vacío", () => {
    assert.throws(() => validarCambios({}), ProductoInvalidoError);
  });

  it("ignora campos que no existen", () => {
    assert.deepEqual(validarCambios({ stock: 5, hackeo: true }), { stock: 5 });
  });
});

describe("utilidades", () => {
  it("slugDesdeSku quita el prefijo CF- para conservar las URLs actuales", () => {
    assert.equal(slugDesdeSku("CF-RM-27T"), "RM-27T");
    assert.equal(slugDesdeSku("XYZ-1"), "XYZ-1");
  });

  it("margenPct calcula con un decimal y devuelve null si falta el costo", () => {
    assert.equal(margenPct(78000, 130000), 40);
    assert.equal(margenPct(76000, 125000), 39.2);
    assert.equal(margenPct(null, 130000), null);
  });

  it("estadoStock distingue agotado, bajo (≤5) y ok", () => {
    assert.equal(estadoStock(0), "agotado");
    assert.equal(estadoStock(5), "bajo");
    assert.equal(estadoStock(6), "ok");
  });
});
