import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { construirContexto, margenPct } from "@/modules/asistente/domain/contexto";
import type { FuentesNegocio } from "@/modules/operacion/domain/fuentes";

const AHORA = new Date("2026-09-27T12:00:00.000Z");

const fuentes: FuentesNegocio = {
  fuente: "ejemplo",
  pedidos: [
    { id: "1", items: 3, total: 500000, pago: "Pagado", estado: "Entregado" },
    { id: "2", items: 1, total: 100000, pago: "Pendiente", estado: "Pendiente de pago" },
    { id: "3", items: 2, total: 200000, pago: "Pagado", estado: "Entregado" },
  ],
  inventario: [
    { nombre: "A", sku: "A1", proveedor: "P", costo: 60000, precio: 100000, stock: 0 },
    { nombre: "B", sku: "B1", proveedor: "P", costo: 50000, precio: 100000, stock: 3 },
    { nombre: "C", sku: "C1", proveedor: "P", costo: 70000, precio: 100000, stock: 20 },
  ],
  listaCompras: [
    { producto: "x", variante: "M", origen: "o1", estado: "Pendiente" },
    { producto: "y", variante: "L", origen: "o2", estado: "Conseguido" },
    { producto: "z", variante: "S", origen: "o3", estado: "No conseguido" },
  ],
  catalogo: [
    { club: "Real Madrid", categoria: "europeo", retro: false },
    { club: "Bayern", categoria: "europeo", retro: true },
    { club: "Millonarios", categoria: "colombiano", retro: false },
  ],
};

describe("margenPct", () => {
  it("calcula margen sobre el precio con un decimal", () => {
    assert.equal(margenPct(78000, 130000), 40);
    assert.equal(margenPct(76000, 125000), 39.2);
  });
  it("devuelve 0 si el precio no es válido", () => {
    assert.equal(margenPct(10, 0), 0);
  });
});

describe("construirContexto", () => {
  const c = construirContexto(fuentes, AHORA);

  it("suma ventas y calcula ticket promedio", () => {
    assert.equal(c.ventas.totalPedidos, 3);
    assert.equal(c.ventas.ingresosTotalesCOP, 800000);
    assert.equal(c.ventas.unidadesVendidas, 6);
    assert.equal(c.ventas.ticketPromedioCOP, 266667);
    assert.deepEqual(c.ventas.pedidosPorEstado, { Entregado: 2, "Pendiente de pago": 1 });
    assert.deepEqual(c.ventas.pedidosPorPago, { Pagado: 2, Pendiente: 1 });
  });

  it("calcula margen promedio y detecta agotados y stock bajo", () => {
    assert.equal(c.inventario.margenPromedioPct, 40);
    assert.deepEqual(c.inventario.productosAgotados, ["A"]);
    assert.deepEqual(c.inventario.productosStockBajo, ["B"]);
  });

  it("resume la lista de compras y el catálogo", () => {
    assert.equal(c.listaCompras.pendientes, 1);
    assert.equal(c.listaCompras.conseguidos, 1);
    assert.equal(c.listaCompras.noConseguidos, 1);
    assert.deepEqual(c.listaCompras.itemsPendientes, [{ producto: "x", variante: "M", origen: "o1" }]);
    assert.deepEqual(c.catalogo.porCategoria, { europeo: 2, colombiano: 1 });
    assert.equal(c.catalogo.referenciasRetro, 1);
  });

  it("fija la fecha y avisa que los datos son de ejemplo", () => {
    assert.equal(c.fechaActual, "2026-09-27");
    assert.match(c.nota, /ejemplo/i);
  });

  it("no divide por cero con datos vacíos", () => {
    const vacio = construirContexto(
      { fuente: "sistema", pedidos: [], inventario: [], listaCompras: [], catalogo: [] },
      AHORA,
    );
    assert.equal(vacio.ventas.ticketPromedioCOP, 0);
    assert.equal(vacio.inventario.margenPromedioPct, 0);
  });
});
