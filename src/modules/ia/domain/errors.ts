/** La solicitud del usuario no es válida (vacía, muy corta o muy larga). */
export class SolicitudInvalidaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SolicitudInvalidaError";
  }
}

/** La IA respondió, pero no con un informe que cumpla el formato esperado. */
export class InformeInvalidoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InformeInvalidoError";
  }
}
