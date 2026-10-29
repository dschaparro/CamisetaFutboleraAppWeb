import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { modoPasarela, pasarelaActiva } from "@/modules/pedidos/infrastructure/pasarela";
import { pasarelaSimulada } from "@/modules/pedidos/infrastructure/pasarela-simulada";

const keys = ["MERCADOPAGO_ACCESS_TOKEN", "APP_URL", "NEXT_PUBLIC_APP_URL"] as const;
const prev: Record<string, string | undefined> = {};

afterEach(() => {
  for (const k of keys) {
    if (prev[k] === undefined) delete process.env[k];
    else process.env[k] = prev[k];
    delete prev[k];
  }
});

function setEnv(valores: Partial<Record<(typeof keys)[number], string>>) {
  for (const k of keys) {
    if (!(k in prev)) prev[k] = process.env[k];
    const v = valores[k];
    if (v === undefined) delete process.env[k];
    else process.env[k] = v;
  }
}

describe("modoPasarela", () => {
  it("es simulada sin token o sin APP_URL https", () => {
    setEnv({ MERCADOPAGO_ACCESS_TOKEN: "TEST-123", APP_URL: "http://localhost:3000" });
    assert.equal(modoPasarela(), "simulada");
    assert.equal(pasarelaActiva(), pasarelaSimulada);
  });

  it("es mercadopago con token y APP_URL https", () => {
    setEnv({
      MERCADOPAGO_ACCESS_TOKEN: "TEST-APP-USR-xxx",
      APP_URL: "https://camiseta.example.com",
    });
    assert.equal(modoPasarela(), "mercadopago");
  });
});
