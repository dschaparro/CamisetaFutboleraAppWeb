import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hashPassword, verifyPassword } from "@/modules/identidad/domain/password";

describe("password", () => {
  it("acepta la contraseña original y rechaza otra", async () => {
    const stored = await hashPassword("Futbolera2027!");
    assert.equal(await verifyPassword("Futbolera2027!", stored), true);
    assert.equal(await verifyPassword("otra", stored), false);
  });

  it("rechaza un hash malformado", async () => {
    assert.equal(await verifyPassword("x", "no-es-un-hash"), false);
  });
});
