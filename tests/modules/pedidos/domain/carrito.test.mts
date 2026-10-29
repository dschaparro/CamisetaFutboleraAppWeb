import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CARRITO_QTY_MAX,
  CarritoInvalidoError,
  fusionarCarritos,
  fusionarConTope,
  limitarProductos,
  parsearLineasCarrito,
  type LineaCarrito,
} from "@/modules/pedidos/domain/carrito";

function linea(parcial: Partial<LineaCarrito> & Pick<LineaCarrito, "slug">): LineaCarrito {
  return {
    talla: "M",
    manga: "Corta",
    personalizacion: "Sin personalización",
    cantidad: 1,
    club: "Club",
    nombre: "Camiseta",
    initials: "CF",
    cat: "Liga",
    precio: 100_000,
    ...parcial,
  };
}

describe("fusionarCarritos", () => {
  it("suma cantidades de la misma línea y respeta el tope", () => {
    const cuenta = [linea({ slug: "RM-27T", cantidad: 3, precio: 130_000 })];
    const invitado = [linea({ slug: "RM-27T", cantidad: 8, precio: 125_000, nombre: "Titular" })];
    const r = fusionarCarritos(cuenta, invitado);
    assert.equal(r.length, 1);
    assert.equal(r[0]!.cantidad, CARRITO_QTY_MAX);
    assert.equal(r[0]!.nombre, "Titular");
    assert.equal(r[0]!.precio, 125_000);
  });

  it("conserva líneas distintas", () => {
    const r = fusionarCarritos(
      [linea({ slug: "RM-27T", talla: "M" })],
      [linea({ slug: "RM-27T", talla: "L" }), linea({ slug: "PSG-27T" })],
    );
    assert.equal(r.length, 3);
  });

  it("con invitado vacío deja el de la cuenta", () => {
    const cuenta = [linea({ slug: "BAY-99R", cantidad: 2 })];
    assert.deepEqual(fusionarCarritos(cuenta, []), cuenta.map((l) => ({ ...l, cantidad: 2 })));
  });
});

describe("parsearLineasCarrito", () => {
  it("acepta forma CartItem del browser", () => {
    const r = parsearLineasCarrito([
      {
        slug: "RM-27T",
        size: "M",
        sleeve: "Corta",
        custom: '"X" #10',
        qty: 2,
        club: "Real Madrid",
        name: "Titular",
        initials: "RM",
        cat: "LaLiga",
        price: 130000,
      },
    ]);
    assert.equal(r.length, 1);
    assert.equal(r[0]!.talla, "M");
    assert.equal(r[0]!.personalizacion, '"X" #10');
    assert.equal(r[0]!.cantidad, 2);
  });

  it("rechaza body que no es lista", () => {
    assert.throws(() => parsearLineasCarrito({}), (e) => e instanceof CarritoInvalidoError);
  });

  it("rechaza más productos distintos que el tope", () => {
    assert.throws(
      () =>
        parsearLineasCarrito([linea({ slug: "A" }), linea({ slug: "B" }), linea({ slug: "C" })], {
          maxProductos: 2,
        }),
      (e) => e instanceof CarritoInvalidoError && /máximo 2/.test(e.message),
    );
  });

  it("respeta el tope de cantidad por línea", () => {
    const r = parsearLineasCarrito([linea({ slug: "A", cantidad: 9 })], { maxCantidad: 3 });
    assert.equal(r[0]!.cantidad, 3);
  });
});

describe("limitarProductos / fusionarConTope", () => {
  it("deja pasar si no supera el tope", () => {
    const lineas = [linea({ slug: "A" }), linea({ slug: "B" })];
    assert.deepEqual(limitarProductos(lineas, 5), lineas);
  });

  it("prioriza líneas de la cuenta al recortar", () => {
    const cuenta = [linea({ slug: "A" }), linea({ slug: "B" }), linea({ slug: "C" })];
    const invitado = [linea({ slug: "D" }), linea({ slug: "E" })];
    const r = fusionarConTope(cuenta, invitado, 4);
    assert.equal(r.length, 4);
    assert.deepEqual(
      r.map((l) => l.slug),
      ["A", "B", "C", "D"],
    );
  });
});
