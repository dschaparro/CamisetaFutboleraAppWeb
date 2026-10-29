import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { validarAccion } from "@/modules/asistente/domain/acciones";
import type { ProductoTienda } from "@/modules/asistente/domain/types";

const base = { club: "X", categoria: "europeo", precio: 1, personalizable: true, retro: false, etiqueta: null };
const CATALOGO: ProductoTienda[] = [
  { ...base, slug: "RM-27T", nombre: "Camiseta Real Madrid Titular 2026/27", disponibilidad: "disponible" },
  { ...base, slug: "FCB-27V", nombre: "Camiseta FC Barcelona Visitante 2026/27", disponibilidad: "agotado" },
];

describe("validarAccion", () => {
  it("acepta destinos de la lista y productos del catálogo", () => {
    assert.deepEqual(validarAccion("abrir_pagina", { ruta: "/cuenta?seccion=pedidos" }, CATALOGO), {
      tipo: "abrir",
      ruta: "/cuenta?seccion=pedidos",
      etiqueta: "Mis pedidos",
    });
    assert.deepEqual(validarAccion("abrir_pagina", { ruta: "/cuenta#pedidos" }, CATALOGO), {
      tipo: "abrir",
      ruta: "/cuenta#pedidos",
      etiqueta: "Mis pedidos",
    });
    assert.equal(validarAccion("abrir_pagina", { ruta: "/producto/RM-27T" }, CATALOGO)?.etiqueta, "Ver Real Madrid Titular 2026/27");
  });

  it("rechaza rutas externas, del panel o productos inexistentes", () => {
    for (const ruta of ["https://evil.co", "/panel/usuarios", "/producto/NO-EXISTE", "//evil.co"]) {
      assert.equal(validarAccion("abrir_pagina", { ruta }, CATALOGO), null);
    }
  });

  it("agregar al carrito valida talla y cantidad, y no ofrece productos agotados", () => {
    assert.equal(validarAccion("agregar_al_carrito", { slug: "RM-27T", talla: "M", manga: "Larga", cantidad: 2 }, CATALOGO)?.etiqueta, "Agregar 2× Real Madrid Titular 2026/27 · talla M");
    assert.equal(validarAccion("agregar_al_carrito", { slug: "FCB-27V", talla: "M", manga: "Corta", cantidad: 1 }, CATALOGO), null);
    assert.equal(validarAccion("agregar_al_carrito", { slug: "RM-27T", talla: "XXL", manga: "Corta", cantidad: 1 }, CATALOGO), null);
    assert.equal(validarAccion("agregar_al_carrito", { slug: "RM-27T", talla: "M", manga: "Corta", cantidad: 50 }, CATALOGO), null);
  });

  it("ignora herramientas desconocidas", () => {
    assert.equal(validarAccion("borrar_todo", {}, CATALOGO), null);
  });
});
