import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cuerpoCorreoReset, remitenteCorreo } from "@/modules/identidad/infrastructure/correo-reset";

describe("correo reset", () => {
  it("arma asunto y cuerpo con el enlace", () => {
    const m = cuerpoCorreoReset("Laura", "https://app.example/recuperar/nueva?token=abc");
    assert.match(m.subject, /contraseña/i);
    assert.match(m.text, /Laura/);
    assert.match(m.text, /https:\/\/app\.example\/recuperar\/nueva\?token=abc/);
    assert.match(m.html, /token=abc/);
  });

  it("usa CORREO_FROM o el remitente de prueba de Resend", () => {
    const prev = process.env.CORREO_FROM;
    try {
      delete process.env.CORREO_FROM;
      assert.match(remitenteCorreo(), /onboarding@resend\.dev/);
      process.env.CORREO_FROM = "Tienda <noreply@midominio.com>";
      assert.equal(remitenteCorreo(), "Tienda <noreply@midominio.com>");
    } finally {
      if (prev === undefined) delete process.env.CORREO_FROM;
      else process.env.CORREO_FROM = prev;
    }
  });
});
