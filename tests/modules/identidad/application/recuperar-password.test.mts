import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { hashPassword } from "@/modules/identidad/domain/password";
import type { ClienteConHash } from "@/modules/identidad/domain/types";
import type { ResetTokenRegistro, ResetTokenRepo } from "@/modules/identidad/domain/reset-password";
import {
  confirmarResetPassword,
  solicitarResetPassword,
} from "@/modules/identidad/application/recuperar-password";
import { CuentaInvalidaError } from "@/modules/identidad/domain/cuentas";
import { verifyPassword } from "@/modules/identidad/domain/password";

function tokensMemoria(): ResetTokenRepo & { all: () => ResetTokenRegistro[] } {
  const map = new Map<string, ResetTokenRegistro>();
  return {
    all: () => [...map.values()],
    async guardar(reg) {
      map.set(reg.tokenHash, { ...reg, usadoEn: reg.usadoEn ?? null });
    },
    async buscarPorHash(h) {
      return map.get(h) ?? null;
    },
    async marcarUsado(h, ahora = Date.now()) {
      const a = map.get(h);
      if (a) map.set(h, { ...a, usadoEn: ahora });
    },
    async invalidarDeCliente(clienteId) {
      for (const [k, v] of map) {
        if (v.clienteId === clienteId) map.set(k, { ...v, usadoEn: Date.now() });
      }
    },
  };
}

describe("recuperar contraseña", () => {
  it("rechaza correo inválido", async () => {
    await assert.rejects(
      () =>
        solicitarResetPassword(
          { email: "malo" },
          {
            clientes: { findByEmail: async () => null } as never,
            usuarios: { findByEmail: async () => null } as never,
            tokens: tokensMemoria(),
            mail: { enviarEnlaceReset: async () => {} },
            baseUrl: "http://localhost:3000",
          },
        ),
      CuentaInvalidaError,
    );
  });

  it("indica sin_cuenta si el correo no existe", async () => {
    const r = await solicitarResetPassword(
      { email: "nadie@demo.co" },
      {
        clientes: { findByEmail: async () => null } as never,
        usuarios: { findByEmail: async () => null } as never,
        tokens: tokensMemoria(),
        mail: { enviarEnlaceReset: async () => {} },
        baseUrl: "http://localhost:3000",
      },
    );
    assert.equal(r.estado, "sin_cuenta");
  });

  it("indica cuenta_equipo si solo es personal del panel", async () => {
    const r = await solicitarResetPassword(
      { email: "admin@demo.co" },
      {
        clientes: { findByEmail: async () => null } as never,
        usuarios: {
          findByEmail: async () => ({ id: "u1", email: "admin@demo.co", nombre: "Admin", rol: "Administrador", activo: true, passwordHash: "x" }),
        } as never,
        tokens: tokensMemoria(),
        mail: { enviarEnlaceReset: async () => {} },
        baseUrl: "http://localhost:3000",
      },
    );
    assert.equal(r.estado, "cuenta_equipo");
  });

  it("envía enlace y permite confirmar la nueva contraseña", async () => {
    const hashInicial = await hashPassword("Antigua12");
    let hashActual = hashInicial;
    const cliente: ClienteConHash = {
      id: "c1",
      email: "laura@demo.co",
      nombre: "Laura",
      telefono: null,
      activo: true,
      passwordHash: hashInicial,
    };
    const tokens = tokensMemoria();
    let urlEnviada = "";

    const sol = await solicitarResetPassword(
      { email: "laura@demo.co" },
      {
        clientes: {
          findByEmail: async () => ({ ...cliente, passwordHash: hashActual }),
          actualizar: async (_id, c) => {
            if (c.passwordHash) hashActual = c.passwordHash;
            return { id: cliente.id, email: cliente.email, nombre: cliente.nombre, telefono: null, activo: true };
          },
        } as never,
        usuarios: { findByEmail: async () => null } as never,
        tokens,
        mail: {
          enviarEnlaceReset: async ({ url }) => {
            urlEnviada = url;
          },
        },
        baseUrl: "http://localhost:3000",
      },
    );
    assert.equal(sol.estado, "enviado");
    const token = new URL(urlEnviada).searchParams.get("token");
    assert.ok(token && token.length === 64);

    await confirmarResetPassword(
      { token, password: "NuevaClave99", confirmar: "NuevaClave99" },
      {
        clientes: {
          actualizar: async (_id, c) => {
            if (c.passwordHash) hashActual = c.passwordHash;
            return { id: cliente.id, email: cliente.email, nombre: cliente.nombre, telefono: null, activo: true };
          },
        } as never,
        tokens,
      },
    );

    assert.equal(await verifyPassword("NuevaClave99", hashActual), true);
    assert.equal(await verifyPassword("Antigua12", hashActual), false);

    await assert.rejects(
      () =>
        confirmarResetPassword(
          { token, password: "OtraClave11", confirmar: "OtraClave11" },
          {
            clientes: { actualizar: async () => null } as never,
            tokens,
          },
        ),
      CuentaInvalidaError,
    );
  });

  it("rechaza confirmación con contraseñas distintas", async () => {
    await assert.rejects(
      () =>
        confirmarResetPassword(
          { token: "a".repeat(64), password: "NuevaClave99", confirmar: "OtraClave99" },
          {
            clientes: { actualizar: async () => null } as never,
            tokens: tokensMemoria(),
          },
        ),
      CuentaInvalidaError,
    );
  });

  it("rechaza token vencido", async () => {
    const tokens = tokensMemoria();
    const ahora = Date.now();
    let urlEnviada = "";
    await solicitarResetPassword(
      { email: "laura@demo.co" },
      {
        clientes: {
          findByEmail: async () => ({
            id: "c1",
            email: "laura@demo.co",
            nombre: "Laura",
            telefono: null,
            activo: true,
            passwordHash: "x",
          }),
        } as never,
        usuarios: { findByEmail: async () => null } as never,
        tokens,
        mail: {
          enviarEnlaceReset: async ({ url }) => {
            urlEnviada = url;
          },
        },
        baseUrl: "http://localhost:3000",
        ahora,
      },
    );
    const token = new URL(urlEnviada).searchParams.get("token");
    await assert.rejects(
      () =>
        confirmarResetPassword(
          { token, password: "NuevaClave99", confirmar: "NuevaClave99" },
          {
            clientes: { actualizar: async () => null } as never,
            tokens,
            ahora: ahora + 2 * 60 * 60 * 1000,
          },
        ),
      CuentaInvalidaError,
    );
  });
});
