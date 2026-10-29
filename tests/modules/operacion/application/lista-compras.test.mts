import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  cambiarEstadoItemLista,
  listarListaCompras,
  registrarFaltantesPedido,
} from "@/modules/operacion/application/lista-compras";
import type { ItemLista, ListaComprasRepo } from "@/modules/operacion/application/puertos";
import { NoEncontradoError, OperacionInvalidaError } from "@/modules/operacion/domain/operacion";
import type { Pedido } from "@/modules/pedidos/domain/types";

const item: ItemLista = {
  id: 7,
  productoId: "RM-27T",
  producto: "Real Madrid Titular",
  variante: "M / Corta",
  personalizacion: "",
  cantidad: 1,
  origen: "CF-001",
  pedidoId: "CF-001",
  estado: "Pendiente",
  nota: null,
  creadaEn: "2026-10-16T12:00:00Z",
};

function repoFake(): ListaComprasRepo & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    async listar() {
      calls.push("listar");
      return [item];
    },
    async cambiarEstado(id, estado, nota) {
      calls.push(`estado:${id}:${estado}:${nota ?? ""}`);
      return { ...item, id, estado, nota };
    },
    async registrarFaltantes(pedido) {
      calls.push(`faltantes:${pedido.id}`);
      return 3;
    },
  };
}

const pedidoMinimo = { id: "CF-001" } as Pedido;

describe("lista-compras application", () => {
  it("lista vía el puerto", async () => {
    const repo = repoFake();
    const r = await listarListaCompras(repo);
    assert.equal(r.items.length, 1);
    assert.deepEqual(repo.calls, ["listar"]);
  });

  it("valida el cambio de estado antes de persistir", async () => {
    const repo = repoFake();
    await assert.rejects(() => cambiarEstadoItemLista("7", { estado: "Inventado" }, repo), OperacionInvalidaError);
    assert.deepEqual(repo.calls, []);
  });

  it("rechaza ids que no son enteros positivos", async () => {
    const repo = repoFake();
    await assert.rejects(() => cambiarEstadoItemLista("abc", { estado: "Conseguido" }, repo), NoEncontradoError);
    assert.deepEqual(repo.calls, []);
  });

  it("cambia estado y registra faltantes vía el puerto", async () => {
    const repo = repoFake();
    const r = await cambiarEstadoItemLista("7", { estado: "Conseguido", nota: "ok" }, repo);
    assert.equal(r.item.estado, "Conseguido");
    assert.equal(await registrarFaltantesPedido(pedidoMinimo, repo), 3);
    assert.deepEqual(repo.calls, ["estado:7:Conseguido:ok", "faltantes:CF-001"]);
  });
});
