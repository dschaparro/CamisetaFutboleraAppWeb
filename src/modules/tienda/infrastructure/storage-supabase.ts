/**
 * Adaptador futuro de Supabase Storage para imágenes de producto/banner.
 * Hoy las imágenes viven en Postgres (bytea) vía `TiendaRepo.guardarImagen`.
 * Cuando STORAGE_BUCKET esté definido, este módulo será el destino de subidas.
 *
 * Docs: https://supabase.com/docs/guides/storage
 */

export type ObjetoStorage = { path: string; contentType: string; bytes: Buffer };

export type StorageImagenes = {
  subir(path: string, archivo: ObjetoStorage): Promise<{ urlPublica: string }>;
  borrar(path: string): Promise<void>;
};

export function storageConfigurado(): boolean {
  return Boolean(process.env.SUPABASE_STORAGE_BUCKET?.trim());
}

/** Stub: falla con mensaje actionable hasta cablear el SDK / REST de Storage. */
export const storageSupabase: StorageImagenes = {
  async subir() {
    throw new Error(
      storageConfigurado()
        ? "Storage: falta implementar la subida a Supabase (ver docs/ops-producto.md)."
        : "Storage no configurado: define SUPABASE_STORAGE_BUCKET cuando dejes de usar bytea.",
    );
  },
  async borrar() {
    throw new Error("Storage: borrado no implementado aún.");
  },
};
