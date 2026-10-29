import { errorJson } from "@/modules/identidad/infrastructure/sesiones";
import { borrarImagenSubida, cambiarImagenesProducto, guardarImagenSubida, imagenBanner } from "@/modules/tienda/application/tienda";
import { leerImagen, leerJson, responder } from "@/modules/tienda/infrastructure/http";
import { tiendaRepo } from "@/modules/tienda/infrastructure/repositorio";

export async function POST(request: Request) {
  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return errorJson(400, "VALIDATION_ERROR", "Envía la imagen como formulario");
  }
  const destino = form.get("destino");
  const id = String(form.get("id") ?? "");
  if (destino !== "producto" && destino !== "banner") return errorJson(400, "VALIDATION_ERROR", "Destino inválido");

  return responder(async () => {
    const repo = tiendaRepo();
    const img = await leerImagen(form.get("archivo"));
    const imagenId = `img-${crypto.randomUUID()}`;
    await guardarImagenSubida(repo, imagenId, img);
    try {
      if (destino === "producto") return { item: await cambiarImagenesProducto(repo, id, { agregar: imagenId }), imagenId };
      await imagenBanner(repo, id, imagenId);
      return { imagenId };
    } catch (err) {
      await borrarImagenSubida(repo, imagenId);
      throw err;
    }
  });
}

export async function PATCH(request: Request) {
  return responder(async () => {
    const repo = tiendaRepo();
    const body = (await leerJson(request)) as Record<string, unknown>;
    if (typeof body.banner === "string") {
      await imagenBanner(repo, body.banner, null);
      return { ok: true };
    }
    return {
      item: await cambiarImagenesProducto(repo, String(body.id ?? ""), {
        principal: typeof body.principal === "string" ? body.principal : undefined,
        quitar: typeof body.quitar === "string" ? body.quitar : undefined,
        agregarUrl: "url" in body ? body.url : undefined,
      }),
    };
  });
}
