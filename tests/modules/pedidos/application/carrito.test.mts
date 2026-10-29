import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { enlazarCarritoInvitado, guardarCarrito, obtenerCarrito } from "@/modules/pedidos/application/carrito";
import type { CarritoRepo } from "@/modules/pedidos/application/puertos";
import type { LineaCarrito } from "@/modules/pedidos/domain/carrito";

function fakeRepo(inicial: LineaCarrito[] = []): CarritoRepo & { store: Map<string, LineaCarrito[]> } {
  const store = new Map<string, LineaCarrito[]>();
  store.set("cli-1", [...inicial]);
  return {
    store,
    async obtener(id) {
      return [...(store.get(id) ?? [])];
    },
    async reemplazar(id, lineas) {
      store.set(id, [...lineas]);
    },
  };
}

const base = {
  slug: "RM-27T",
  talla: "M",
  manga: "Corta",
  personalizacion: "Sin personalización",
  club: "Real Madrid",
  nombre: "Titular",
  initials: "RM",
  cat: "LaLiga",
  precio: 130000,
};

describe("application/carrito", () => {
  it("guarda y obtiene el carrito de la cuenta", async () => {
    const repo = fakeRepo();
    const guardado = await guardarCarrito("cli-1", [{ ...base, qty: 2 }], repo);
    assert.equal(guardado[0]!.cantidad, 2);
    const leido = await obtenerCarrito("cli-1", repo);
    assert.equal(leido.length, 1);
    assert.equal(leido[0]!.cantidad, 2);
  });

  it("enlaza invitado sumando cantidades con el de la cuenta", async () => {
    const repo = fakeRepo([{ ...base, cantidad: 2 }]);
    const fusion = await enlazarCarritoInvitado("cli-1", [{ ...base, qty: 3, name: "Titular 27" }], repo);
    assert.equal(fusion.length, 1);
    assert.equal(fusion[0]!.cantidad, 5);
    assert.equal((await obtenerCarrito("cli-1", repo))[0]!.cantidad, 5);
  });

  it("guarda rechazando más líneas que el tope configurado", async () => {
    const repo = fakeRepo();
    await assert.rejects(
      () =>
        guardarCarrito(
          "cli-1",
          [
            { ...base, slug: "A", qty: 1 },
            { ...base, slug: "B", qty: 1 },
            { ...base, slug: "C", qty: 1 },
          ],
          repo,
          { maxProductos: 2, maxCantidad: 5 },
        ),
      (e: Error) => /máximo 2/.test(e.message),
    );
  });

  it("enlaza recortando productos nuevos del invitado al tope", async () => {
    const repo = fakeRepo([
      { ...base, slug: "A", cantidad: 1 },
      { ...base, slug: "B", cantidad: 1 },
    ]);
    const fusion = await enlazarCarritoInvitado(
      "cli-1",
      [
        { ...base, slug: "C", qty: 1 },
        { ...base, slug: "D", qty: 1 },
      ],
      repo,
      { maxProductos: 3, maxCantidad: 5 },
    );
    assert.equal(fusion.length, 3);
    assert.deepEqual(
      fusion.map((l) => l.slug),
      ["A", "B", "C"],
    );
  });
});
