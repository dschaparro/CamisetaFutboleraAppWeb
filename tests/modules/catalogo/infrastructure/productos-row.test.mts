import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toFila, toProducto, type ProductoRow } from "@/modules/catalogo/infrastructure/productos-row";

const FILA: ProductoRow = {
  id: "8f6c2a52-3b0e-4f3f-9d43-0d6c0b8f1a11",
  sku: "CF-RM-27T",
  slug: "RM-27T",
  nombre: "Camiseta Real Madrid Titular 2027",
  club: "Real Madrid",
  categoria: "europeo",
  precio: 130000,
  costo: 78000,
  stock: 12,
  proveedor: "Distrideportes",
  iniciales: "RM",
  personalizable: true,
  retro: false,
  etiqueta: "Nuevo",
  visible: true,
  updated_at: "2026-10-01T12:00:00Z",
};

describe("toProducto", () => {
  it("traduce updated_at a actualizadoEn", () => {
    const p = toProducto(FILA);
    assert.equal(p?.actualizadoEn, "2026-10-01T12:00:00Z");
    assert.equal(p && "updated_at" in p, false);
  });

  it("descarta una categoría que no existe en dominio", () => {
    assert.equal(toProducto({ ...FILA, categoria: "asiatico" }), null);
  });

  it("convierte una etiqueta desconocida en null", () => {
    assert.equal(toProducto({ ...FILA, etiqueta: "Oferta" })?.etiqueta, null);
  });
});

describe("toFila", () => {
  it("solo incluye los campos presentes", () => {
    assert.deepEqual(toFila({ precio: 120000, visible: false }), { precio: 120000, visible: false });
  });

  it("conserva null para dejar el costo pendiente", () => {
    assert.deepEqual(toFila({ costo: null }), { costo: null });
  });
});
