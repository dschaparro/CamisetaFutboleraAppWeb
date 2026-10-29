import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { conContextoDePagina, construirSistema, lineaProducto, slugDePagina } from "@/modules/asistente/domain/prompt";
import type { ProductoTienda } from "@/modules/asistente/domain/types";

const RM: ProductoTienda = {
  slug: "RM-27T",
  nombre: "Camiseta Real Madrid Titular 2026/27",
  club: "Real Madrid",
  categoria: "europeo",
  precio: 130000,
  personalizable: true,
  retro: false,
  etiqueta: "Nuevo",
  disponibilidad: "disponible",
};

describe("construirSistema", () => {
  const sistema = construirSistema([RM]);

  it("incluye la información de la tienda y el catálogo con slug y precio en COP", () => {
    assert.match(sistema, /<tienda>[\s\S]*WhatsApp 322 317 6175[\s\S]*<\/tienda>/);
    assert.match(sistema, /<catalogo>[\s\S]*Real Madrid[\s\S]*\$130\.000[\s\S]*slug: RM-27T[\s\S]*<\/catalogo>/);
  });

  it("es idéntico entre llamadas (necesario para la caché de la API)", () => {
    assert.equal(construirSistema([RM]), sistema);
  });

  it("avisa cuando no hay productos", () => {
    assert.match(construirSistema([]), /sin productos disponibles/);
  });
});

describe("lineaProducto", () => {
  it("describe rasgos útiles para recomendar", () => {
    assert.match(lineaProducto(RM), /personalizable/);
    assert.match(lineaProducto(RM), /nueva/);
    assert.match(lineaProducto({ ...RM, personalizable: false, retro: true, etiqueta: "Retro" }), /no personalizable, retro/);
  });
});

describe("slugDePagina", () => {
  it("solo reconoce rutas de producto", () => {
    assert.equal(slugDePagina("/producto/RM-27T"), "RM-27T");
    assert.equal(slugDePagina("/carrito"), null);
    assert.equal(slugDePagina("/producto/../panel"), null);
    assert.equal(slugDePagina(42), null);
  });
});

describe("conContextoDePagina", () => {
  const mensajes = [
    { role: "user" as const, content: "hola" },
    { role: "assistant" as const, content: "¡Hola!" },
    { role: "user" as const, content: "¿y esta?" },
  ];

  it("anota el producto solo en el último mensaje del cliente", () => {
    const r = conContextoDePagina(mensajes, RM);
    assert.equal(r[0].content, "hola");
    assert.match(r[2].content, /^<pagina_actual>.*RM-27T.*<\/pagina_actual>\n\n¿y esta\?$/);
  });

  it("no cambia nada si no está en una página de producto", () => {
    assert.equal(conContextoDePagina(mensajes, null), mensajes);
  });
});
