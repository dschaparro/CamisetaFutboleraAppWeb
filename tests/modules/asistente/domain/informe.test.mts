import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { InformeInvalidoError } from "@/modules/asistente/domain/errors";
import { validarInforme } from "@/modules/asistente/domain/informe";

const AHORA = new Date("2026-09-27T12:00:00.000Z");

const valido = {
  titulo: "  Ventas y margen  ",
  kpis: [{ etiqueta: "Ventas", valor: "$1.330.000" }],
  secciones: [{ titulo: "Resumen", texto: "Todo bien.", alerta: false }],
};

describe("validarInforme", () => {
  it("acepta un informe válido, recorta espacios y agrega fecha y fuente", () => {
    const informe = validarInforme(valido, "ejemplo", AHORA);
    assert.equal(informe.titulo, "Ventas y margen");
    assert.equal(informe.generadoEn, "2026-09-27T12:00:00.000Z");
    assert.equal(informe.fuenteDatos, "ejemplo");
    assert.equal(informe.secciones[0]?.alerta, false);
  });

  it("solo marca alerta cuando es exactamente true", () => {
    const informe = validarInforme(
      { ...valido, secciones: [{ titulo: "A", texto: "b", alerta: "true" }] },
      "ejemplo",
      AHORA,
    );
    assert.equal(informe.secciones[0]?.alerta, false);
  });

  it("rechaza lo que no es un objeto", () => {
    assert.throws(() => validarInforme(null, "ejemplo", AHORA), InformeInvalidoError);
    assert.throws(() => validarInforme("texto", "ejemplo", AHORA), InformeInvalidoError);
    assert.throws(() => validarInforme([], "ejemplo", AHORA), InformeInvalidoError);
  });

  it("rechaza título vacío o ausente", () => {
    assert.throws(() => validarInforme({ ...valido, titulo: "   " }, "ejemplo", AHORA), InformeInvalidoError);
    assert.throws(() => validarInforme({ ...valido, titulo: undefined }, "ejemplo", AHORA), InformeInvalidoError);
  });

  it("rechaza más de 4 indicadores y listas vacías", () => {
    const cinco = Array.from({ length: 5 }, (_, i) => ({ etiqueta: `k${i}`, valor: "1" }));
    assert.throws(() => validarInforme({ ...valido, kpis: cinco }, "ejemplo", AHORA), InformeInvalidoError);
    assert.throws(() => validarInforme({ ...valido, kpis: [] }, "ejemplo", AHORA), InformeInvalidoError);
    assert.throws(() => validarInforme({ ...valido, secciones: [] }, "ejemplo", AHORA), InformeInvalidoError);
  });

  it("rechaza campos con tipo equivocado o demasiado largos", () => {
    assert.throws(
      () => validarInforme({ ...valido, kpis: [{ etiqueta: "x", valor: 5 }] }, "ejemplo", AHORA),
      InformeInvalidoError,
    );
    assert.throws(
      () =>
        validarInforme(
          { ...valido, secciones: [{ titulo: "t", texto: "x".repeat(1501), alerta: false }] },
          "ejemplo",
          AHORA,
        ),
      InformeInvalidoError,
    );
  });
});
