import type { CatalogoChat, CompletadorChat } from "@/modules/asistente/application/puertos";
import { catalogoTienda } from "@/modules/asistente/infrastructure/catalogo-tienda";
import { responderEnStream } from "@/modules/asistente/infrastructure/claude-chat";

export const catalogoChat: CatalogoChat = {
  listar: catalogoTienda,
};

export const completadorChat: CompletadorChat = {
  stream: responderEnStream,
};
