import type { AccionChat, MensajeChat, ProductoTienda } from "@/modules/asistente/domain/types";

export type CatalogoChat = {
  listar(): Promise<ProductoTienda[]>;
};

export type CompletadorChat = {
  stream(entrada: {
    sistema: string;
    mensajes: MensajeChat[];
    signal: AbortSignal;
    validarAccion: (nombre: string, input: unknown) => AccionChat | null;
  }): Promise<AsyncIterable<string>>;
};
