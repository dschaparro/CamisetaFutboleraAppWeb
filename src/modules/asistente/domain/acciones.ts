import type { AccionChat, ProductoTienda } from "@/modules/asistente/domain/types";
import { CARRITO_MAX_CANTIDAD_MAX } from "@/modules/tienda/domain/types";

/** Separa el texto de las acciones en la respuesta en streaming (carácter que el modelo no escribe). */
export const SEPARADOR_ACCIONES = "\u001e";

/** Lugares de la tienda que GOALIX puede abrir, con el texto del botón. */
export const DESTINOS: Record<string, string> = {
  "/": "Ir al inicio",
  "/catalogo": "Ver catálogo por ligas",
  "/catalogo/todas?ofertas=1": "Ver ofertas",
  "/catalogo/laliga": "Ver LaLiga",
  "/catalogo/premier": "Ver Premier League",
  "/catalogo/ligue1": "Ver Ligue 1",
  "/catalogo/bundesliga": "Ver Bundesliga",
  "/catalogo/betplay": "Ver Liga BetPlay",
  "/catalogo/selecciones": "Ver Selecciones",
  "/carrito": "Ver mi carrito",
  "/checkout": "Finalizar compra",
  "/cuenta?seccion=pedidos": "Mis pedidos",
  "/cuenta?seccion=datos": "Mis datos",
  "/cuenta?seccion=direcciones": "Mis direcciones",
  "/cuenta?seccion=seguridad": "Cambiar contraseña",
  // Hash legacy (por si el modelo aún lo sugiere)
  "/cuenta#pedidos": "Mis pedidos",
  "/cuenta#datos": "Mis datos",
  "/cuenta#direcciones": "Mis direcciones",
  "/cuenta#seguridad": "Cambiar contraseña",
  "/terminos": "Cambios y devoluciones",
  "/ingresar": "Ingresar a mi cuenta",
  "/registro": "Crear cuenta",
};

const TALLAS = ["S", "M", "L", "XL"];
const MANGAS = ["Corta", "Larga"];

/** Herramientas que ve el modelo. No se ejecutan en el servidor: se convierten en botones. */
export const HERRAMIENTAS = [
  {
    name: "abrir_pagina",
    description:
      "Muestra al cliente un botón para ir a una página de la tienda. Úsala cuando quiera ver una camiseta, su carrito, pagar, sus pedidos, direcciones, cambiar contraseña, ingresar o ver las políticas.",
    input_schema: {
      type: "object" as const,
      properties: {
        ruta: {
          type: "string",
          description: `Una de: ${Object.keys(DESTINOS).join(", ")}, o /producto/<slug> con un slug del catálogo.`,
        },
      },
      required: ["ruta"],
    },
  },
  {
    name: "agregar_al_carrito",
    description:
      "Muestra al cliente un botón para agregar una camiseta a su carrito. Úsala solo cuando ya eligió camiseta y talla. Nunca digas que ya quedó agregada: el cliente la confirma con el botón.",
    input_schema: {
      type: "object" as const,
      properties: {
        slug: { type: "string", description: "Slug exacto del catálogo." },
        talla: { type: "string", enum: TALLAS },
        manga: { type: "string", enum: MANGAS, description: "Corta si el cliente no dijo nada." },
        cantidad: { type: "integer", minimum: 1, maximum: CARRITO_MAX_CANTIDAD_MAX },
      },
      required: ["slug", "talla", "manga", "cantidad"],
    },
  },
];

function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/**
 * Convierte una llamada del modelo en una acción segura, o null si no es válida
 * (ruta fuera de la lista, producto inexistente o agotado, talla inválida…).
 */
export function validarAccion(nombre: string, input: unknown, catalogo: ProductoTienda[]): AccionChat | null {
  if (!esObjeto(input)) return null;

  if (nombre === "abrir_pagina" && typeof input.ruta === "string") {
    const ruta = input.ruta.trim();
    if (DESTINOS[ruta]) return { tipo: "abrir", ruta, etiqueta: DESTINOS[ruta] };
    const slug = /^\/producto\/([A-Za-z0-9-]{1,40})$/.exec(ruta)?.[1];
    const p = slug ? catalogo.find((x) => x.slug === slug) : undefined;
    return p ? { tipo: "abrir", ruta, etiqueta: `Ver ${p.nombre.replace(/^Camiseta /, "")}` } : null;
  }

  if (nombre === "agregar_al_carrito") {
    const p = catalogo.find((x) => x.slug === input.slug);
    const cantidad = input.cantidad;
    if (!p || p.disponibilidad === "agotado") return null;
    if (typeof input.talla !== "string" || !TALLAS.includes(input.talla)) return null;
    const manga = typeof input.manga === "string" && MANGAS.includes(input.manga) ? input.manga : "Corta";
    if (
      typeof cantidad !== "number" ||
      !Number.isInteger(cantidad) ||
      cantidad < 1 ||
      cantidad > CARRITO_MAX_CANTIDAD_MAX
    ) {
      return null;
    }
    const nombreCorto = p.nombre.replace(/^Camiseta /, "");
    return {
      tipo: "carrito",
      slug: p.slug,
      talla: input.talla,
      manga,
      cantidad,
      etiqueta: `Agregar ${cantidad > 1 ? `${cantidad}× ` : ""}${nombreCorto} · talla ${input.talla}`,
    };
  }

  return null;
}
