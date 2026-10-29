import { validarAccion } from "@/modules/asistente/domain/acciones";
import { validarConversacion } from "@/modules/asistente/domain/conversacion";
import { construirSistema, conContextoDePagina, slugDePagina } from "@/modules/asistente/domain/prompt";
import type { CatalogoChat, CompletadorChat } from "@/modules/asistente/application/puertos";

export async function prepararStreamChat(
  raw: { mensajes: unknown; pagina: unknown },
  deps: { catalogo: CatalogoChat; completador: CompletadorChat },
  signal: AbortSignal,
): Promise<AsyncIterable<string>> {
  const mensajes = validarConversacion(raw.mensajes);
  const catalogo = await deps.catalogo.listar();
  const slug = slugDePagina(raw.pagina);
  const productoActual = slug ? (catalogo.find((p) => p.slug === slug) ?? null) : null;

  return deps.completador.stream({
    sistema: construirSistema(catalogo),
    mensajes: conContextoDePagina(mensajes, productoActual),
    signal,
    validarAccion: (nombre, input) => validarAccion(nombre, input, catalogo),
  });
}
