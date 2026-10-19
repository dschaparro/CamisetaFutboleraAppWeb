import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { actualizarUsuario, crearUsuario, type UsuariosAdminRepo } from "@/modules/identidad/application/gestionar-usuarios";
import { ingresar } from "@/modules/identidad/application/ingresar";
import { registrarCliente } from "@/modules/identidad/application/registrar-cliente";
import {
  CuentaInvalidaError,
  EmailYaRegistradoError,
  OperacionNoPermitidaError,
  validarRegistroCliente,
  type ClienteRepo,
} from "@/modules/identidad/domain/cuentas";
import { hashPassword } from "@/modules/identidad/domain/password";
import { verifyClienteToken, verifySessionToken } from "@/modules/identidad/domain/token";
import type { ClienteConHash, Usuario, UsuarioConHash } from "@/modules/identidad/domain/types";

const SECRET = "s".repeat(32);

async function repos() {
  const hash = await hashPassword("Clave1234");
  const usuarios: UsuarioConHash[] = [
    { id: "u1", email: "admin@x.co", nombre: "Ana", rol: "Administrador", activo: true, passwordHash: hash },
    { id: "u2", email: "bodega@x.co", nombre: "Beto", rol: "Bodega", activo: true, passwordHash: hash },
  ];
  const clientes: ClienteConHash[] = [
    { id: "c1", email: "laura@x.co", nombre: "Laura", telefono: null, activo: true, passwordHash: hash },
  ];
  const publico = (u: UsuarioConHash): Usuario => ({ id: u.id, email: u.email, nombre: u.nombre, rol: u.rol, activo: u.activo });
  const usuariosRepo: UsuariosAdminRepo = {
    listar: async () => usuarios.map(publico),
    findById: async (id) => {
      const u = usuarios.find((x) => x.id === id);
      return u ? publico(u) : null;
    },
    findByEmail: async (email) => usuarios.find((x) => x.email === email) ?? null,
    crear: async (d) => {
      const u = { id: `u${usuarios.length + 1}`, activo: true, ...d };
      usuarios.push(u);
      return publico(u);
    },
    actualizar: async (id, cambios) => {
      const u = usuarios.find((x) => x.id === id);
      if (!u) return null;
      Object.assign(u, cambios);
      return publico(u);
    },
  };
  const clientesRepo: ClienteRepo = {
    findByEmail: async (email) => clientes.find((x) => x.email === email) ?? null,
    findById: async (id) => clientes.find((x) => x.id === id) ?? null,
    crear: async (d) => {
      const c = { id: `c${clientes.length + 1}`, activo: true, ...d };
      clientes.push(c);
      return c;
    },
  };
  return { usuarios: usuariosRepo, clientes: clientesRepo };
}

describe("ingresar (login único)", () => {
  it("el personal recibe token del panel y va a su ruta inicial", async () => {
    const r = await ingresar("ADMIN@x.co", "Clave1234", await repos(), SECRET);
    assert.equal(r?.tipo, "personal");
    assert.equal(r?.destino, "/panel/dashboard");
    assert.equal((await verifySessionToken(r!.token, SECRET))?.rol, "Administrador");
  });

  it("el cliente recibe token de tienda (que no sirve en el panel) y va a /cuenta", async () => {
    const r = await ingresar("laura@x.co", "Clave1234", await repos(), SECRET);
    assert.equal(r?.tipo, "cliente");
    assert.equal(r?.destino, "/cuenta");
    assert.equal((await verifyClienteToken(r!.token, SECRET))?.sub, "c1");
    assert.equal(await verifySessionToken(r!.token, SECRET), null);
  });

  it("devuelve null con contraseña equivocada o correo inexistente", async () => {
    const rs = await repos();
    assert.equal(await ingresar("laura@x.co", "otra", rs, SECRET), null);
    assert.equal(await ingresar("nadie@x.co", "Clave1234", rs, SECRET), null);
  });
});

describe("registro de clientes", () => {
  it("valida campos y normaliza el teléfono", () => {
    const d = validarRegistroCliente({ nombre: " Ana  Ruiz ", email: "ANA@X.CO", telefono: "+57 322 317 6175", password: "12345678" });
    assert.deepEqual(d, { nombre: "Ana Ruiz", email: "ana@x.co", telefono: "3223176175", password: "12345678" });
  });

  it("reporta todos los errores juntos", () => {
    try {
      validarRegistroCliente({ nombre: "", email: "malo", telefono: "12", password: "123" });
      assert.fail("debía fallar");
    } catch (e) {
      assert.ok(e instanceof CuentaInvalidaError);
      assert.deepEqual(Object.keys(e.campos).sort(), ["email", "nombre", "password", "telefono"]);
    }
  });

  it("crea la cuenta e inicia sesión; rechaza correos de clientes o del personal", async () => {
    const rs = await repos();
    const { cliente, token } = await registrarCliente({ nombre: "Ana", email: "ana@x.co", password: "12345678" }, rs, SECRET);
    assert.equal((await verifyClienteToken(token, SECRET))?.sub, cliente.id);
    await assert.rejects(registrarCliente({ nombre: "Otra", email: "laura@x.co", password: "12345678" }, rs, SECRET), EmailYaRegistradoError);
    await assert.rejects(registrarCliente({ nombre: "Otra", email: "admin@x.co", password: "12345678" }, rs, SECRET), EmailYaRegistradoError);
  });
});

describe("gestión de usuarios del personal", () => {
  it("crea una cuenta con rol válido y la nueva cuenta puede ingresar", async () => {
    const rs = await repos();
    const u = await crearUsuario({ nombre: "Mara", email: "mara@x.co", rol: "Marketing", password: "Temporal1" }, rs);
    assert.equal(u.rol, "Marketing");
    assert.equal((await ingresar("mara@x.co", "Temporal1", rs, SECRET))?.tipo, "personal");
  });

  it("nadie se quita su propio acceso de Administrador", async () => {
    const rs = await repos();
    await assert.rejects(actualizarUsuario("u1", "u1", { activo: false }, rs.usuarios), OperacionNoPermitidaError);
    await assert.rejects(actualizarUsuario("u1", "u1", { rol: "Vendedor" }, rs.usuarios), OperacionNoPermitidaError);
  });

  it("siempre queda al menos un Administrador activo", async () => {
    const rs = await repos();
    await assert.rejects(actualizarUsuario("u2", "u1", { activo: false }, rs.usuarios), OperacionNoPermitidaError);
  });

  it("desactivar impide ingresar y cambiar la contraseña la actualiza", async () => {
    const rs = await repos();
    await actualizarUsuario("u1", "u2", { password: "NuevaClave9" }, rs.usuarios);
    assert.equal((await ingresar("bodega@x.co", "NuevaClave9", rs, SECRET))?.tipo, "personal");
    await actualizarUsuario("u1", "u2", { activo: false }, rs.usuarios);
    assert.equal(await ingresar("bodega@x.co", "NuevaClave9", rs, SECRET), null);
  });

  it("devuelve null si el usuario no existe", async () => {
    assert.equal(await actualizarUsuario("u1", "zzz", { nombre: "X Y" }, (await repos()).usuarios), null);
  });
});
