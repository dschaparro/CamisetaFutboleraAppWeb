import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  actualizarProductoInventario,
  listarInventario,
  registrarCompraProveedor,
} from "@/modules/operacion/application/inventario";
import type { InventarioRepo } from "@/modules/operacion/application/puertos";
import { OperacionInvalidaError } from "@/modules/operacion/domain/operacion";

function repoFake(): InventarioRepo & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    listar: async () => {
      calls.push("listar");
      return {
        productos: [],
        proveedores: [],
        resumen: { unidades: 0, pendientesPorConseguir: 0, proveedores: 0, costoPromedio: null },
      };
    },
    actualizar: async (id, cambios) => {
      calls.push(`actualizar:${id}`);
      return {
        id,
        nombre: "X",
        sku: `CF-${id}`,
        proveedor: cambios.proveedor ?? "",
        costo: cambios.costo ?? null,
        precio: 100,
        margenPct: null,
        stock: cambios.stock ?? 0,
      };
    },
    registrarCompra: async (c) => {
      calls.push(`compra:${c.productoId}`);
      return {
        id: 1,
        producto: "X",
        cantidad: c.cantidad,
        costoUnitario: c.costoUnitario,
        proveedor: c.proveedor,
        stockResultante: c.cantidad,
      };
    },
  };
}

describe("inventario application", () => {
  it("lista vía el puerto", async () => {
    const repo = repoFake();
    await listarInventario(repo);
    assert.deepEqual(repo.calls, ["listar"]);
  });

  it("valida cambios antes de actualizar", async () => {
    const repo = repoFake();
    await assert.rejects(() => actualizarProductoInventario("p1", {}, repo), OperacionInvalidaError);
    assert.deepEqual(repo.calls, []);
  });

  it("registra compra validada", async () => {
    const repo = repoFake();
    const r = await registrarCompraProveedor(
      { productoId: "p1", cantidad: 2, costoUnitario: 50000, proveedor: "Nike", nota: "" },
      repo,
    );
    assert.equal(r.compra.cantidad, 2);
    assert.deepEqual(repo.calls, ["compra:p1"]);
  });
});
