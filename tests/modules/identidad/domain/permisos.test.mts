import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { MODULOS, modulosDe, puedeAcceder, rutaInicial } from "@/modules/identidad/domain/permisos";
import { ROLES } from "@/modules/identidad/domain/types";

describe("permisos", () => {
  it("el Administrador entra a todos los módulos", () => {
    assert.equal(modulosDe("Administrador").length, MODULOS.length);
  });

  it("cada rol ve el Dashboard y llega ahí al iniciar sesión", () => {
    for (const rol of ROLES) assert.equal(rutaInicial(rol), "/panel/dashboard");
  });

  it("solo el Administrador gestiona usuarios (página y API)", () => {
    for (const rol of ROLES) {
      assert.equal(puedeAcceder(rol, "/panel/usuarios"), rol === "Administrador");
      assert.equal(puedeAcceder(rol, "/api/usuarios/abc"), rol === "Administrador");
    }
  });

  it("Bodega no registra ventas ni ve informes; Marketing no ve pedidos", () => {
    assert.equal(puedeAcceder("Bodega", "/panel/venta-manual"), false);
    assert.equal(puedeAcceder("Bodega", "/api/informes"), false);
    assert.equal(puedeAcceder("Bodega", "/panel/inventario"), true);
    assert.equal(puedeAcceder("Marketing", "/panel/pedidos"), false);
    assert.equal(puedeAcceder("Marketing", "/api/informes"), true);
  });

  it("niega lo que no está en la tabla (una página nueva queda cerrada)", () => {
    assert.equal(puedeAcceder("Administrador", "/panel/algo-nuevo"), false);
    assert.equal(puedeAcceder("Administrador", "/api/otra"), false);
  });

  it("no confunde prefijos parecidos", () => {
    assert.equal(puedeAcceder("Vendedor", "/panel/pedidos-falsos"), false);
  });
});
