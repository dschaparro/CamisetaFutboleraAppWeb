import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { signSessionToken, verifySessionToken } from "@/modules/identidad/domain/token";

const SECRET = "a".repeat(32);

describe("token", () => {
  it("firma y verifica un JWT de sesión", async () => {
    const token = await signSessionToken(
      {
        sub: "user-1",
        email: "stiven@camisetafutbolera.com",
        nombre: "Stiven",
        rol: "Administrador",
      },
      SECRET,
    );

    assert.equal(token.split(".").length, 3);

    const claims = await verifySessionToken(token, SECRET);
    assert.deepEqual(claims, {
      sub: "user-1",
      email: "stiven@camisetafutbolera.com",
      nombre: "Stiven",
      rol: "Administrador",
    });
  });

  it("rechaza un token firmado con otro secreto", async () => {
    const token = await signSessionToken(
      {
        sub: "user-1",
        email: "a@b.co",
        nombre: "A",
        rol: "Vendedor",
      },
      SECRET,
    );
    assert.equal(await verifySessionToken(token, "b".repeat(32)), null);
  });
});
