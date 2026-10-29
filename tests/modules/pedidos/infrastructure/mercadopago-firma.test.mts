import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import { afterEach, describe, it } from "node:test";
import { validarFirmaWebhook } from "@/modules/pedidos/infrastructure/mercadopago-api";

const SECRET = "test-webhook-secret";
const prev = process.env.MERCADOPAGO_WEBHOOK_SECRET;

afterEach(() => {
  if (prev === undefined) delete process.env.MERCADOPAGO_WEBHOOK_SECRET;
  else process.env.MERCADOPAGO_WEBHOOK_SECRET = prev;
});

describe("validarFirmaWebhook", () => {
  it("acepta una firma HMAC válida según el manifest oficial", () => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = SECRET;
    const dataId = "123456";
    const requestId = "abc-req";
    const ts = "1704908010";
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const v1 = createHmac("sha256", SECRET).update(manifest).digest("hex");
    assert.equal(
      validarFirmaWebhook({
        xSignature: `ts=${ts},v1=${v1}`,
        xRequestId: requestId,
        dataId,
      }),
      true,
    );
  });

  it("rechaza firmas alteradas", () => {
    process.env.MERCADOPAGO_WEBHOOK_SECRET = SECRET;
    assert.equal(
      validarFirmaWebhook({
        xSignature: "ts=1,v1=deadbeef",
        xRequestId: "x",
        dataId: "1",
      }),
      false,
    );
  });
});
