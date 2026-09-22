import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { toUsuario } from "@/modules/identidad/infrastructure/usuarios-row";

describe("toUsuario", () => {
  it("traduce password_hash de la fila al modelo de dominio", () => {
    const user = toUsuario({
      id: "1",
      email: "a@b.co",
      nombre: "Ana",
      rol: "Vendedor",
      password_hash: "salt:hash",
      activo: true,
    });
    assert.equal(user?.passwordHash, "salt:hash");
    assert.equal(user && "password_hash" in user, false);
  });

  it("descarta un rol que no existe en dominio", () => {
    assert.equal(
      toUsuario({
        id: "1",
        email: "a@b.co",
        nombre: "Ana",
        rol: "Cliente",
        password_hash: "x",
        activo: true,
      }),
      null,
    );
  });
});
