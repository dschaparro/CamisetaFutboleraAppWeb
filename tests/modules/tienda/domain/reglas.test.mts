import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  aplicarCupon,
  bannersVigentes,
  CuponInvalidoError,
  DatosInvalidosError,
  mejorPromocion,
  validarBanner,
  validarCupon,
  validarProducto,
  vistaPublica,
} from "@/modules/tienda/domain/reglas";
import type { Banner, Cupon, Liga, Producto, Promocion } from "@/modules/tienda/domain/types";

const AHORA = new Date("2026-10-06T12:00:00-05:00");
const LIGAS: Liga[] = [{ id: "laliga", nombre: "LaLiga", pais: "España", descripcion: "", colores: ["#000000", "#ffffff"], imagen: null, posicion: "center", orden: 1, visible: true }];
const P: Producto = {
  id: "RM-27T", nombre: "Camiseta Real Madrid", club: "Real Madrid", ligaId: "laliga", categoria: "europeo", precio: 130000, costo: 78000,
  stock: 3, iniciales: "RM", personalizable: true, retro: false, etiqueta: null, descripcion: "", imagenes: [], posicionImagen: "center", escudo: null, visible: true,
};
const promo = (o: Partial<Promocion>): Promocion => ({
  id: "x", etiqueta: "Oferta", porcentaje: 10, alcance: "productos", productoIds: ["RM-27T"], ligaId: null,
  desde: "2026-10-01T00:00:00Z", hasta: "2026-10-31T00:00:00Z", activa: true, ...o,
});

describe("ofertas y vista pública", () => {
  it("elige la promoción vigente de mayor descuento (producto, liga o toda la tienda)", () => {
    const ps = [promo({ porcentaje: 10 }), promo({ id: "l", alcance: "liga", ligaId: "laliga", productoIds: [], porcentaje: 25 }), promo({ id: "t", alcance: "todo", productoIds: [], porcentaje: 5 })];
    assert.equal(mejorPromocion(P, ps, AHORA)?.porcentaje, 25);
  });

  it("ignora ofertas pausadas, vencidas o futuras", () => {
    assert.equal(mejorPromocion(P, [promo({ activa: false }), promo({ hasta: "2026-10-02T00:00:00Z" }), promo({ desde: "2026-11-01T00:00:00Z", hasta: "2026-12-01T00:00:00Z" })], AHORA), null);
  });

  it("la vista pública trae precio final y disponibilidad, sin costo ni stock", () => {
    const v = vistaPublica(P, [promo({ porcentaje: 20 })], AHORA);
    assert.equal(v.precioFinal, 104000);
    assert.equal(v.disponibilidad, "pocas");
    assert.equal("costo" in v || "stock" in v, false);
    assert.equal(vistaPublica({ ...P, stock: 0 }, [], AHORA).disponibilidad, "agotado");
  });
});

describe("validaciones del panel", () => {
  it("producto nuevo: código, liga e iniciales; costo opcional", () => {
    const p = validarProducto({ ...P, id: "juv-27t", precio: "150000", costo: "", stock: "5" }, LIGAS, true);
    assert.equal(p.id, "JUV-27T");
    assert.equal(p.costo, null);
    assert.throws(() => validarProducto({ ...P, id: "x", ligaId: "otra", iniciales: "" }, LIGAS, true), (e) => {
      assert.ok(e instanceof DatosInvalidosError);
      return !!e.campos.id && !!e.campos.ligaId && !!e.campos.iniciales;
    });
  });

  it("banner: solo enlaces internos de la tienda y fechas en orden", () => {
    const base = { titulo: "Hola", boton: "Ver", enlace: "/catalogo", color1: "#000000", color2: "#111111", acento: "#ffffff", orden: 1, desde: "2026-10-01", hasta: "2026-10-31" };
    assert.equal(validarBanner(base).enlace, "/catalogo");
    for (const enlace of ["https://otro.co", "//otro.co", "/panel/usuarios", "/api/x"]) {
      assert.throws(() => validarBanner({ ...base, enlace }), DatosInvalidosError);
    }
    assert.throws(() => validarBanner({ ...base, hasta: "2026-09-01" }), DatosInvalidosError);
  });

  it("imágenes por URL: solo https; se rechaza javascript:, http y data:", () => {
    const base = { titulo: "Hola", boton: "Ver", enlace: "/catalogo", color1: "#000000", color2: "#111111", acento: "#ffffff", orden: 1, desde: "2026-10-01", hasta: "2026-10-31" };
    assert.equal(validarBanner({ ...base, imagen: "https://upload.wikimedia.org/x.jpg" }).imagen, "https://upload.wikimedia.org/x.jpg");
    assert.equal(validarBanner({ ...base, imagen: "" }).imagen, null);
    for (const imagen of ["javascript:alert(1)", "http://x.co/a.jpg", "data:image/png;base64,AAA", "https://x .co/a.jpg"]) {
      assert.throws(() => validarBanner({ ...base, imagen }), DatosInvalidosError);
    }
  });

  it("cupón: código único", () => {
    const existentes = [{ id: "c1", codigo: "MUNDIAL10" } as Cupon];
    assert.throws(() => validarCupon({ codigo: "mundial10", tipo: "porcentaje", valor: 10, minimoCompra: 0, hasta: "2026-12-31" }, existentes, null), DatosInvalidosError);
    assert.equal(validarCupon({ codigo: "mundial10", tipo: "porcentaje", valor: 10, minimoCompra: 0, hasta: "2026-12-31" }, existentes, "c1").codigo, "MUNDIAL10");
  });
});

describe("aplicarCupon", () => {
  const c: Cupon = { id: "c1", codigo: "MUNDIAL10", tipo: "porcentaje", valor: 10, minimoCompra: 100000, hasta: "2026-12-31T00:00:00Z", usosMaximos: 2, usos: 0, activo: true };

  it("calcula el descuento por porcentaje o valor fijo", () => {
    assert.equal(aplicarCupon([c], " mundial10 ", 200000, AHORA).descuento, 20000);
    assert.equal(aplicarCupon([{ ...c, tipo: "valor", valor: 15000 }], "MUNDIAL10", 200000, AHORA).descuento, 15000);
  });

  it("rechaza inexistentes, inactivos, vencidos, agotados o bajo el mínimo", () => {
    for (const [lista, sub] of [
      [[c], 50000],
      [[{ ...c, activo: false }], 200000],
      [[{ ...c, hasta: "2026-01-01T00:00:00Z" }], 200000],
      [[{ ...c, usos: 2 }], 200000],
      [[], 200000],
    ] as [Cupon[], number][]) {
      assert.throws(() => aplicarCupon(lista, "MUNDIAL10", sub, AHORA), CuponInvalidoError);
    }
  });
});

describe("bannersVigentes", () => {
  it("solo activos dentro de su fecha, en orden", () => {
    const b = (id: string, orden: number, o: Partial<Banner> = {}) => ({ id, orden, activo: true, desde: "2026-10-01T00:00:00Z", hasta: "2026-10-31T00:00:00Z", ...o }) as Banner;
    assert.deepEqual(bannersVigentes([b("b", 2), b("a", 1), b("x", 0, { activo: false }), b("y", 0, { hasta: "2026-10-02T00:00:00Z" })], AHORA).map((x) => x.id), ["a", "b"]);
  });
});
