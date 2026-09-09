import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { iniciarSesion } from "@/modules/identidad/application/iniciar-sesion";
import { hashPassword } from "@/modules/identidad/domain/password";
import { verifySessionToken } from "@/modules/identidad/domain/token";
import type { UsuarioConHash } from "@/modules/identidad/domain/types";
import type { UsuarioRepo } from "@/modules/identidad/domain/authenticate";

const SECRET = "a".repeat(32);

function repoWith(user: UsuarioConHash | null): UsuarioRepo {
  return {
    findByEmail: async (email) => (user && user.email === email ? user : null),
  };
}

describe("iniciarSesion", () => {
  it("devuelve usuario público y un JWT válido", async () => {
    const passwordHash = await hashPassword("secreta");
    const stored: UsuarioConHash = {
      id: "1",
      email: "stiven@camisetafutbolera.com",
      nombre: "Stiven",
      rol: "Administrador",
      activo: true,
      passwordHash,
    };

    const result = await iniciarSesion(
      "stiven@camisetafutbolera.com",
      "secreta",
      repoWith(stored),
      SECRET,
    );

    assert.ok(result);
    assert.deepEqual(result.user, {
      id: "1",
      email: "stiven@camisetafutbolera.com",
      nombre: "Stiven",
      rol: "Administrador",
      activo: true,
    });
    assert.equal("passwordHash" in result.user, false);
    const claims = await verifySessionToken(result.token, SECRET);
    assert.equal(claims?.sub, "1");
    assert.equal(claims?.rol, "Administrador");
  });

  it("devuelve null si las credenciales fallan", async () => {
    const result = await iniciarSesion("nadie@cf.co", "x", repoWith(null), SECRET);
    assert.equal(result, null);
  });
});
