import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { pasarelaActiva } from "@/modules/pedidos/infrastructure/pasarela";
import { pasarelaSimulada } from "@/modules/pedidos/infrastructure/pasarela-simulada";
import { pasarelaWompi } from "@/modules/pedidos/infrastructure/pasarela-wompi";

const keys = ["WOMPI_USE_REAL", "WOMPI_PRIVATE_KEY", "WOMPI_PUBLIC_KEY"] as const;
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

describe("pasarelaActiva", () => {
  it("usa la simulada por defecto", () => {
    setEnv({});
    assert.equal(pasarelaActiva(), pasarelaSimulada);
  });

  it("elige Wompi solo con USE_REAL y ambas claves", () => {
    setEnv({
      WOMPI_USE_REAL: "true",
      WOMPI_PRIVATE_KEY: "prv_test",
      WOMPI_PUBLIC_KEY: "pub_test",
    });
    assert.equal(pasarelaActiva(), pasarelaWompi);
  });
});
