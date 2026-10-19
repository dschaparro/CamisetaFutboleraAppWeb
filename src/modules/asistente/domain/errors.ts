/** La conversación que manda el navegador no tiene la forma esperada. */
export class ConversacionInvalidaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConversacionInvalidaError";
  }
}
