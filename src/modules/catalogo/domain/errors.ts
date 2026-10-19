/** Datos de producto inválidos. `campos` trae un mensaje por campo para mostrarlo en el formulario. */
export class ProductoInvalidoError extends Error {
  readonly campos: Record<string, string>;

  constructor(campos: Record<string, string>) {
    super(Object.values(campos)[0] ?? "Datos de producto inválidos");
    this.name = "ProductoInvalidoError";
    this.campos = campos;
  }
}

/** Ya existe un producto con ese SKU. */
export class SkuDuplicadoError extends Error {
  constructor(sku: string) {
    super(`Ya existe un producto con el SKU ${sku}`);
    this.name = "SkuDuplicadoError";
  }
}
