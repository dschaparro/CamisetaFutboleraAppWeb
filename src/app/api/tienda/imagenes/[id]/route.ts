import { imagenGuardada } from "@/modules/tienda/application/tienda";
import { tiendaRepo } from "@/modules/tienda/infrastructure/repositorio";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const img = await imagenGuardada(tiendaRepo(), id);
  if (!img) return new Response("No encontrada", { status: 404 });
  return new Response(new Uint8Array(img.datos), {
    headers: {
      "Content-Type": img.tipo,
      "Cache-Control": "public, max-age=31536000, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
