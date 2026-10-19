import { imagenGuardada } from "@/modules/tienda/application/tienda";

/** Sirve una imagen subida desde el panel . */
export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const img = await imagenGuardada(id);
  if (!img) return new Response("No encontrada", { status: 404 });
  return new Response(new Uint8Array(img.datos), {
    headers: {
      "Content-Type": img.tipo,
      // El id cambia si cambia la imagen: se puede guardar en caché.
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
