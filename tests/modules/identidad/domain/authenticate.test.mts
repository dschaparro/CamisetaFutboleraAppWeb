import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { authenticate, type UsuarioRepo } from "@/modules/identidad/domain/authenticate";
import { hashPassword } from "@/modules/identidad/domain/password";
import type { UsuarioConHash } from "@/modules/identidad/domain/types";

function repoWith(user: UsuarioConHash | null): UsuarioRepo {
  return {
    findByEmail: async (email) => (user && user.email === email ? user : null),
  };
}

describe("authenticate", () => {
  it("devuelve el usuario público si correo, clave y activo coinciden", async () => {
    const passwordHash = await hashPassword("secreta");
    const stored: UsuarioConHash = {
      id: "1",
      email: "stiven@camisetafutbolera.com",
      nombre: "Stiven",
      rol: "Administrador",
      activo: true,
      passwordHash,
    };

    const user = await authenticate("  Stiven@CamisetaFutbolera.com ", "secreta", repoWith(stored));
    assert.deepEqual(user, {
      id: "1",
      email: "stiven@camisetafutbolera.com",
      nombre: "Stiven",
      rol: "Administrador",
      activo: true,
    });
  });

  it("falla si el correo no existe o la clave es mala", async () => {
    const passwordHash = await hashPassword("secreta");
    const stored: UsuarioConHash = {
      id: "1",
      email: "stiven@camisetafutbolera.com",
      nombre: "Stiven",
      rol: "Administrador",
      activo: true,
      passwordHash,
    };

    assert.equal(await authenticate("nadie@cf.co", "secreta", repoWith(stored)), null);
    assert.equal(await authenticate("stiven@camisetafutbolera.com", "otra", repoWith(stored)), null);
  });

  it("rechaza cuentas inactivas aunque la clave sea correcta", async () => {
    const passwordHash = await hashPassword("secreta");
    const stored: UsuarioConHash = {
      id: "1",
      email: "stiven@camisetafutbolera.com",
      nombre: "Stiven",
      rol: "Vendedor",
      activo: false,
      passwordHash,
    };
    assert.equal(await authenticate("stiven@camisetafutbolera.com", "secreta", repoWith(stored)), null);
  });
});
