import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { allowAttempt, resetAttemptsForTests } from "@/modules/identidad/infrastructure/rate-limit";

describe("allowAttempt", () => {
  it("bloquea al superar el límite en la ventana", () => {
    resetAttemptsForTests();
    const t = 1_000;
    assert.equal(allowAttempt("ip", 2, 60_000, t), true);
    assert.equal(allowAttempt("ip", 2, 60_000, t + 1), true);
    assert.equal(allowAttempt("ip", 2, 60_000, t + 2), false);
    assert.equal(allowAttempt("ip", 2, 60_000, t + 60_001), true);
  });
});
