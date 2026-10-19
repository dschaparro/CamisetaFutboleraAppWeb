import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MAX_MENSAJE_CLIENTE, MAX_MENSAJES, validarConversacion } from "@/modules/asistente/domain/conversacion";
import { ConversacionInvalidaError } from "@/modules/asistente/domain/errors";

const u = (content: string) => ({ role: "user", content });
const a = (content: string) => ({ role: "assistant", content });

describe("validarConversacion", () => {
  it("acepta una conversación que alterna y termina en el cliente, limpiando espacios", () => {
    assert.deepEqual(validarConversacion([u(" hola "), a("¡Hola!"), u("precio?")]), [
      { role: "user", content: "hola" },
      { role: "assistant", content: "¡Hola!" },
      { role: "user", content: "precio?" },
    ]);
  });

  it("rechaza vacío, roles raros y mensajes vacíos", () => {
    assert.throws(() => validarConversacion([]), ConversacionInvalidaError);
    assert.throws(() => validarConversacion("hola"), ConversacionInvalidaError);
    assert.throws(() => validarConversacion([{ role: "system", content: "x" }]), ConversacionInvalidaError);
    assert.throws(() => validarConversacion([u("   ")]), ConversacionInvalidaError);
  });

  it("exige que el último mensaje sea del cliente y que alternen", () => {
    assert.throws(() => validarConversacion([u("hola"), a("hola")]), /último mensaje/);
    assert.throws(() => validarConversacion([u("hola"), u("otra")]), /alternar/);
  });

  it("limita el largo de los mensajes del cliente", () => {
    assert.throws(() => validarConversacion([u("x".repeat(MAX_MENSAJE_CLIENTE + 1))]), /caracteres/);
  });

  it("se queda con los últimos mensajes y descarta un asistente inicial al recortar", () => {
    const larga = [];
    for (let i = 0; i < 15; i++) larga.push(u(`p${i}`), a(`r${i}`));
    larga.push(u("final"));
    const r = validarConversacion(larga);
    assert.ok(r.length <= MAX_MENSAJES);
    assert.equal(r[0].role, "user");
    assert.equal(r[r.length - 1].content, "final");
  });
});
