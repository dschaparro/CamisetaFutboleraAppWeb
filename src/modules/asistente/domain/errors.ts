/** La conversación que manda el navegador no tiene la forma esperada. */
export class ConversacionInvalidaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConversacionInvalidaError";
  }
}

/** La solicitud del informe no es válida (vacía, muy corta o muy larga). */
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
