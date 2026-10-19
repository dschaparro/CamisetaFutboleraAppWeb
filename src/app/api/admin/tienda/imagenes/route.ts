import { errorJson } from "@/modules/identidad/infrastructure/sesiones";
import { borrarImagenSubida, cambiarImagenesProducto, guardarImagenSubida, imagenBanner } from "@/modules/tienda/application/tienda";
import { leerImagen, leerJson, responder } from "@/modules/tienda/infrastructure/http";

/** Sube una imagen (multipart: archivo, destino = producto | banner, id). */
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
    const img = await leerImagen(form.get("archivo"));
    const imagenId = `img-${crypto.randomUUID()}`;
    await guardarImagenSubida(imagenId, img);
    try {
      if (destino === "producto") return { item: await cambiarImagenesProducto(id, { agregar: imagenId }), imagenId };
      await imagenBanner(id, imagenId);
      return { imagenId };
    } catch (err) {
      await borrarImagenSubida(imagenId);
      throw err;
    }
  });
}

/** Producto: { id, principal } o { id, quitar }. Banner: { banner, quitar: true }. */
export async function PATCH(request: Request) {
  return responder(async () => {
    const body = (await leerJson(request)) as Record<string, unknown>;
    if (typeof body.banner === "string") {
      await imagenBanner(body.banner, null);
      return { ok: true };
    }
    return {
      item: await cambiarImagenesProducto(String(body.id ?? ""), {
        principal: typeof body.principal === "string" ? body.principal : undefined,
        quitar: typeof body.quitar === "string" ? body.quitar : undefined,
        // Imagen de internet: { id, url: "https://…" }
        agregarUrl: "url" in body ? body.url : undefined,
      }),
    };
  });
}
