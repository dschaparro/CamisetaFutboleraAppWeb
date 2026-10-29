import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { CatalogoChat, CompletadorChat } from "@/modules/asistente/application/puertos";
import { prepararStreamChat } from "@/modules/asistente/application/responder-chat";
import { ConversacionInvalidaError } from "@/modules/asistente/domain/errors";
import type { ProductoTienda } from "@/modules/asistente/domain/types";

const producto: ProductoTienda = {
  slug: "RM-27T",
  nombre: "Real Madrid Titular",
  club: "Real Madrid",
  categoria: "Titular",
  precio: 130000,
  personalizable: true,
  retro: false,
  etiqueta: null,
  disponibilidad: "disponible",
  liga: "LaLiga",
};

function catalogoFake(items: ProductoTienda[] = [producto]): CatalogoChat {
  return {
    async listar() {
      return items;
    },
  };
}

function completadorFake(): CompletadorChat & {
  llamadas: { sistema: string; mensajes: unknown[] }[];
} {
  const llamadas: { sistema: string; mensajes: unknown[] }[] = [];
  return {
    llamadas,
    async stream(entrada) {
      llamadas.push({ sistema: entrada.sistema, mensajes: entrada.mensajes });
      return (async function* () {
        yield "Hola";
      })();
    },
  };
}

describe("prepararStreamChat", () => {
  it("valida la conversación, arma el sistema y abre el stream", async () => {
    const completador = completadorFake();
    const textos = await prepararStreamChat(
      { mensajes: [{ role: "user", content: "¿Tienen Real Madrid?" }], pagina: "/producto/RM-27T" },
      { catalogo: catalogoFake(), completador },
      new AbortController().signal,
    );
    const chunks: string[] = [];
    for await (const t of textos) chunks.push(t);
    assert.deepEqual(chunks, ["Hola"]);
    assert.equal(completador.llamadas.length, 1);
    assert.match(completador.llamadas[0]!.sistema, /RM-27T/);
  });

  it("rechaza conversaciones inválidas sin llamar al completador", async () => {
    const completador = completadorFake();
    await assert.rejects(
      () =>
        prepararStreamChat(
          { mensajes: [], pagina: "/" },
          { catalogo: catalogoFake(), completador },
          new AbortController().signal,
        ),
      ConversacionInvalidaError,
    );
    assert.equal(completador.llamadas.length, 0);
  });
});
