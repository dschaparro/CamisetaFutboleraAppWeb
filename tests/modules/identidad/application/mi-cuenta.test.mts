import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { luhn, marcaTarjeta, vencimientoValido } from "@/lib/tarjetas";
import { actualizarDatos, cambiarPassword, cambiarPerfil, obtenerMiCuenta, SesionClienteInvalidaError } from "@/modules/identidad/application/mi-cuenta";
import { CuentaInvalidaError } from "@/modules/identidad/domain/cuentas";
import { hashPassword, verifyPassword } from "@/modules/identidad/domain/password";
import type { ClienteCuentaRepo, PerfilCliente } from "@/modules/identidad/domain/perfil-cliente";
import type { ClienteConHash } from "@/modules/identidad/domain/types";

async function repo() {
  const c: ClienteConHash = { id: "c1", email: "a@x.co", nombre: "Ana", telefono: null, activo: true, passwordHash: await hashPassword("Actual123") };
  let perfil: PerfilCliente = { direcciones: [], tarjetas: [] };
  const r: ClienteCuentaRepo = {
    findByEmail: async () => c,
    findById: async () => c,
    crear: async () => c,
    findConHashById: async (id) => (id === "c1" ? c : null),
    actualizar: async (_id, cambios) => Object.assign(c, cambios),
    perfil: async () => structuredClone(perfil),
    guardarPerfil: async (_id, p) => {
      perfil = structuredClone(p);
    },
  };
  return { r, c };
}

const DIR = { alias: "Casa", destinatario: "Ana Ruiz", telefono: "322 317 6175", direccion: "Cra 1 # 2-3", ciudad: "Bogotá" };

function campos(e: unknown): Record<string, string> {
  assert.ok(e instanceof CuentaInvalidaError);
  return e.campos;
}

describe("tarjetas (utilidades)", () => {
  it("valida Luhn, marca y vencimiento", () => {
    assert.equal(luhn("4242424242424242"), true);
    assert.equal(luhn("4242424242424241"), false);
    assert.equal(marcaTarjeta("5555555555554444"), "Mastercard");
    assert.equal(marcaTarjeta("378282246310005"), "American Express");
    assert.equal(vencimientoValido("12/30", new Date("2026-10-05")), true);
    assert.equal(vencimientoValido("09/26", new Date("2026-10-05")), false);
  });
});

describe("obtenerMiCuenta", () => {
  it("devuelve cliente, perfil y pedidos", async () => {
    const { r, c } = await repo();
    const cuenta = await obtenerMiCuenta(c.id, {
      clientes: r,
      listarPedidos: async () => [{ id: "CF-1" }],
    });
    assert.equal(cuenta.cliente.email, "a@x.co");
    assert.equal(cuenta.pedidos.length, 1);
    assert.deepEqual(cuenta.perfil, { direcciones: [], tarjetas: [] });
  });

  it("rechaza cliente inexistente o inactivo", async () => {
    const { r, c } = await repo();
    c.activo = false;
    await assert.rejects(obtenerMiCuenta("c1", { clientes: r, listarPedidos: async () => [] }), SesionClienteInvalidaError);
  });
});

describe("Mis datos y contraseña", () => {
  it("actualiza nombre y teléfono normalizado", async () => {
    const { r } = await repo();
    const c = await actualizarDatos("c1", { nombre: " Ana  Ruiz ", telefono: "+57 300 111 2233" }, r);
    assert.equal(c.nombre, "Ana Ruiz");
    assert.equal(c.telefono, "3001112233");
  });

  it("exige la contraseña actual correcta y una nueva distinta", async () => {
    const { r, c } = await repo();
    await assert.rejects(cambiarPassword("c1", { actual: "Mala", nueva: "Nueva12345" }, r), (e) => !!campos(e).actual);
    await assert.rejects(cambiarPassword("c1", { actual: "Actual123", nueva: "Actual123" }, r), (e) => !!campos(e).nueva);
    await assert.rejects(cambiarPassword("c1", { actual: "Actual123", nueva: "corta" }, r), (e) => !!campos(e).nueva);
    await cambiarPassword("c1", { actual: "Actual123", nueva: "Nueva12345" }, r);
    assert.equal(await verifyPassword("Nueva12345", c.passwordHash), true);
  });
});

describe("direcciones", () => {
  it("la primera queda principal; marcar otra cambia la principal; borrar la principal promueve otra", async () => {
    const { r } = await repo();
    let p = await cambiarPerfil("c1", { tipo: "agregar-direccion", raw: DIR, id: "d1" }, r);
    assert.equal(p.direcciones[0].predeterminada, true);
    p = await cambiarPerfil("c1", { tipo: "agregar-direccion", raw: { ...DIR, alias: "Oficina" }, id: "d2" }, r);
    assert.deepEqual(p.direcciones.map((d) => d.predeterminada), [true, false]);
    p = await cambiarPerfil("c1", { tipo: "predeterminada-direccion", id: "d2" }, r);
    assert.deepEqual(p.direcciones.map((d) => d.predeterminada), [false, true]);
    p = await cambiarPerfil("c1", { tipo: "eliminar-direccion", id: "d2" }, r);
    assert.equal(p.direcciones.length, 1);
    assert.equal(p.direcciones[0].predeterminada, true);
  });

  it("valida campos y el máximo de 5", async () => {
    const { r } = await repo();
    await assert.rejects(cambiarPerfil("c1", { tipo: "agregar-direccion", raw: { ...DIR, direccion: "", telefono: "1" }, id: "x" }, r), (e) => {
      const c = campos(e);
      return !!c.direccion && !!c.telefono;
    });
    for (let i = 0; i < 5; i++) await cambiarPerfil("c1", { tipo: "agregar-direccion", raw: DIR, id: `d${i}` }, r);
    await assert.rejects(cambiarPerfil("c1", { tipo: "agregar-direccion", raw: DIR, id: "d9" }, r), CuentaInvalidaError);
  });
});

describe("formas de pago", () => {
  it("guarda solo marca y últimos 4, sin el número completo", async () => {
    const { r } = await repo();
    const p = await cambiarPerfil("c1", { tipo: "agregar-tarjeta", raw: { numero: "5555 5555 5555 4444", vencimiento: "12/30", titular: "ana ruiz" }, id: "t1" }, r);
    assert.deepEqual(p.tarjetas[0], { id: "t1", marca: "Mastercard", ultimos4: "4444", vencimiento: "12/30", titular: "ANA RUIZ", predeterminada: true });
    assert.equal(JSON.stringify(p).includes("5555555555554444"), false);
  });

  it("rechaza tarjetas inválidas, vencidas o repetidas", async () => {
    const { r } = await repo();
    await assert.rejects(cambiarPerfil("c1", { tipo: "agregar-tarjeta", raw: { numero: "1234 5678 9012 3456", vencimiento: "01/20", titular: "" }, id: "t" }, r), (e) => Object.keys(campos(e)).length === 3);
    const ok = { numero: "4242 4242 4242 4242", vencimiento: "12/30", titular: "ANA" };
    await cambiarPerfil("c1", { tipo: "agregar-tarjeta", raw: ok, id: "t1" }, r);
    await assert.rejects(cambiarPerfil("c1", { tipo: "agregar-tarjeta", raw: ok, id: "t2" }, r), CuentaInvalidaError);
  });
});
