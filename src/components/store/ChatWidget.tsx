"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Fragment, useEffect, useRef, useState, type ReactNode } from "react";
import IconoAsistente from "@/components/store/IconoAsistente";
import { useCart } from "@/context/CartContext";
import { cargarCatalogo } from "@/components/store/useCatalogo";
import { SEPARADOR_ACCIONES } from "@/modules/asistente/domain/acciones";
import type { AccionChat } from "@/modules/asistente/domain/types";

type Msg = { role: "user" | "assistant"; content: string };

const MAX_MENSAJE = 500;
const CLAVE_STORAGE = "cf-chat-v1";
const WHATSAPP = "https://wa.me/573223176175";

const BIENVENIDA =
  "¡Hola! 👋 Soy GOALIX, el asistente virtual de Camiseta Futbolera. Te ayudo a encontrar tu camiseta, con tallas, personalización, envíos y pagos. ¿Qué buscas hoy?";

const SUGERENCIAS = [
  "¿Qué camisetas de la Selección tienen?",
  "¿Puedo ponerle nombre y número?",
  "¿Cuánto se demora el envío?",
  "¿Cómo pago contra entrega?",
];

/* ---------- Texto con enlaces y negritas (sin HTML: nada del modelo se inyecta tal cual) ---------- */

function enlace(texto: string, url: string, key: number): ReactNode {
  if (url.startsWith("/") && !url.startsWith("//")) {
    return (
      <Link key={key} href={url}>
        {texto}
      </Link>
    );
  }
  if (url.startsWith("https://wa.me/")) {
    return (
      <a key={key} href={url} target="_blank" rel="noopener noreferrer">
        {texto}
      </a>
    );
  }
  return texto; // Cualquier otro enlace se muestra solo como texto.
}

function enLinea(texto: string): ReactNode[] {
  const partes: ReactNode[] = [];
  const patron = /\[([^\]]+)\]\(([^)\s]+)\)|\*\*([^*]+)\*\*/g;
  let ultimo = 0;
  let m: RegExpExecArray | null;
  let key = 0;
  while ((m = patron.exec(texto))) {
    if (m.index > ultimo) partes.push(texto.slice(ultimo, m.index));
    partes.push(m[1] !== undefined ? enlace(m[1], m[2], key++) : <b key={key++}>{m[3]}</b>);
    ultimo = m.index + m[0].length;
  }
  if (ultimo < texto.length) partes.push(texto.slice(ultimo));
  return partes;
}

function Formateado({ texto }: { texto: string }) {
  const bloques = texto.split(/\n{2,}/).filter((b) => b.trim());
  return (
    <>
      {bloques.map((bloque, i) => {
        const lineas = bloque.split("\n").filter((l) => l.trim());
        if (lineas.every((l) => /^\s*[-*•]\s+/.test(l))) {
          return (
            <ul key={i}>
              {lineas.map((l, j) => (
                <li key={j}>{enLinea(l.replace(/^\s*[-*•]\s+/, ""))}</li>
              ))}
            </ul>
          );
        }
        return (
          <p key={i}>
            {lineas.map((l, j) => (
              <Fragment key={j}>
                {j > 0 && <br />}
                {enLinea(l)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}

/* ---------- Widget ---------- */

function leerGuardado(): Msg[] {
  try {
    const raw = sessionStorage.getItem(CLAVE_STORAGE);
    const data: unknown = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(data)) return [];
    return data.filter(
      (m): m is Msg =>
        typeof m === "object" && m !== null && (m.role === "user" || m.role === "assistant") && typeof m.content === "string",
    );
  } catch {
    return [];
  }
}

/** Separa el texto de la respuesta y los botones de acción que propuso GOALIX. */
function partir(content: string): { texto: string; acciones: AccionChat[] } {
  const i = content.indexOf(SEPARADOR_ACCIONES);
  if (i < 0) return { texto: content, acciones: [] };
  try {
    return { texto: content.slice(0, i), acciones: JSON.parse(content.slice(i + 1)) as AccionChat[] };
  } catch {
    return { texto: content.slice(0, i), acciones: [] };
  }
}

function Acciones({ acciones, onAgregar }: { acciones: AccionChat[]; onAgregar: (a: Extract<AccionChat, { tipo: "carrito" }>) => Promise<boolean> }) {
  const [hechas, setHechas] = useState<number[]>([]);
  return (
    <div className="chat-acciones">
      {acciones.map((a, i) =>
        a.tipo === "abrir" ? (
          <Link key={i} href={a.ruta} className="chat-accion">
            {a.etiqueta} →
          </Link>
        ) : hechas.includes(i) ? (
          <Link key={i} href="/carrito" className="chat-accion chat-accion-ok">
            ✓ Agregada · ver carrito →
          </Link>
        ) : (
          <button key={i} className="chat-accion chat-accion-carrito" onClick={async () => {
              if (await onAgregar(a)) setHechas((h) => [...h, i]);
            }}>
            🛒 {a.etiqueta}
          </button>
        ),
      )}
    </div>
  );
}

export default function ChatWidget() {
  const pathname = usePathname();
  const { addItem } = useCart();

  /** Agrega con los datos reales del catálogo (el precio no viene del chat). */
  async function agregar(a: Extract<AccionChat, { tipo: "carrito" }>): Promise<boolean> {
    const p = (await cargarCatalogo()).productos.find((x) => x.id === a.slug);
    if (!p || p.disponibilidad === "agotado") return false;
    addItem({ slug: p.id, club: p.club, name: p.nombre, initials: p.iniciales, cat: p.categoria, size: a.talla, sleeve: a.manga, custom: "Sin personalización", qty: a.cantidad, price: p.precioFinal });
    return true;
  }
  const [abierto, setAbierto] = useState(false);
  // Saludo automático de GOALIX cada vez que se entra o se recarga la tienda.
  // El widget vive en el layout: al navegar entre páginas no se vuelve a montar, así que no repite el saludo.
  const [saludoAuto, setSaludoAuto] = useState(false);
  useEffect(() => {
    let ocultar: ReturnType<typeof setTimeout> | undefined;
    const mostrar = setTimeout(() => {
      setSaludoAuto(true);
      ocultar = setTimeout(() => setSaludoAuto(false), 8000);
    }, 1200);
    return () => {
      clearTimeout(mostrar);
      if (ocultar) clearTimeout(ocultar);
    };
  }, []);
  const [mensajes, setMensajes] = useState<Msg[]>([]);
  const [texto, setTexto] = useState("");
  const [escribiendo, setEscribiendo] = useState(false);
  const [error, setError] = useState<{ mensaje: string; pendiente: string } | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const cuerpoRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const cargadoRef = useRef(false);

  const enProducto = pathname.startsWith("/producto/");

  // La conversación sobrevive a la navegación y a recargar la pestaña (no a cerrarla):
  // se recupera la primera vez que se abre el chat.
  function alternar() {
    if (!cargadoRef.current) {
      cargadoRef.current = true;
      setMensajes(leerGuardado());
    }
    setAbierto((o) => !o);
  }

  useEffect(() => {
    if (!cargadoRef.current || escribiendo) return;
    try {
      sessionStorage.setItem(CLAVE_STORAGE, JSON.stringify(mensajes));
    } catch {
      /* sin almacenamiento: la conversación solo vive en memoria */
    }
  }, [mensajes, escribiendo]);

  useEffect(() => {
    cuerpoRef.current?.scrollTo({ top: cuerpoRef.current.scrollHeight });
  }, [mensajes, escribiendo, error, abierto]);

  useEffect(() => {
    if (abierto) inputRef.current?.focus();
  }, [abierto]);

  useEffect(() => () => abortRef.current?.abort(), []);

  async function enviar(contenido: string) {
    const valor = contenido.trim().slice(0, MAX_MENSAJE);
    if (!valor || escribiendo) return;

    const historial: Msg[] = [...mensajes, { role: "user", content: valor }];
    setMensajes([...historial, { role: "assistant", content: "" }]);
    setTexto("");
    setError(null);
    setEscribiendo(true);

    const controller = new AbortController();
    abortRef.current = controller;

    // Si falla, se quita el mensaje del cliente y se ofrece reintentar (la conversación debe alternar).
    const fallar = (mensaje: string) => {
      setMensajes(historial.slice(0, -1));
      setError({ mensaje, pendiente: valor });
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        // Al modelo solo vuelve el texto; los botones de acción son de la interfaz.
        body: JSON.stringify({ mensajes: historial.map((m) => ({ role: m.role, content: partir(m.content).texto })), pagina: pathname }),
        signal: controller.signal,
      });

      if (!res.ok || !res.body) {
        let mensaje = "No pude responder en este momento. Intenta de nuevo.";
        try {
          const data = (await res.json()) as { error?: { message?: string } };
          if (data.error?.message) mensaje = data.error.message;
        } catch {
          /* respuesta sin JSON */
        }
        fallar(mensaje);
        return;
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let respuesta = "";
      for (;;) {
        const { value, done } = await reader.read();
        if (done) break;
        respuesta += decoder.decode(value, { stream: true });
        const parcial = respuesta;
        setMensajes([...historial, { role: "assistant", content: parcial }]);
      }
      if (!respuesta.trim()) fallar("No recibí respuesta. Intenta de nuevo.");
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        // El cliente pulsó «Detener»: se conserva lo que alcanzó a llegar, o se descarta si no llegó nada.
        setMensajes((prev) => {
          const ultimo = prev[prev.length - 1];
          return ultimo?.role === "assistant" && ultimo.content.trim() ? prev : historial.slice(0, -1);
        });
        return;
      }
      fallar("Se perdió la conexión. Revisa tu internet e intenta de nuevo.");
    } finally {
      if (abortRef.current === controller) abortRef.current = null;
      setEscribiendo(false);
      inputRef.current?.focus();
    }
  }

  function nuevaConversacion() {
    abortRef.current?.abort();
    setMensajes([]);
    setError(null);
    setTexto("");
  }

  const ultimo = mensajes[mensajes.length - 1];
  const esperandoPrimerTexto = escribiendo && ultimo?.role === "assistant" && ultimo.content === "";
  const sugerencias = enProducto ? ["¿Me cuentas de esta camiseta?", ...SUGERENCIAS.slice(1)] : SUGERENCIAS;

  return (
    <>
      <button
        className={`chat-fab${abierto ? " chat-fab-abierto" : ""}${saludoAuto && !abierto ? " saludando" : ""}`}
        onClick={() => {
          setSaludoAuto(false);
          alternar();
        }}
        aria-expanded={abierto}
        aria-controls="chat-asistente"
        aria-label={abierto ? "Cerrar chat con GOALIX" : "Abrir chat con GOALIX, el asistente virtual"}
      >
        <IconoAsistente size={78} />
        {!abierto && (
          <span className="chat-fab-saludo" aria-hidden={!saludoAuto} role={saludoAuto ? "status" : undefined}>
            ¡Hola! Soy <b>GOALIX</b> ⚽<br />
            ¿En qué puedo ayudarte hoy?
          </span>
        )}
      </button>

      <div
        id="chat-asistente"
        className={`chat-panel${abierto ? " open" : ""}`}
        role="dialog"
        aria-label="GOALIX, asistente virtual de Camiseta Futbolera"
        onKeyDown={(e) => e.key === "Escape" && setAbierto(false)}
      >
        <div className="chat-head">
          <span className="chat-avatar">
            <IconoAsistente size={34} />
            <span className="dot" aria-hidden="true" />
          </span>
          <div className="chat-head-texto">
            <b>GOALIX</b>
            <span>Asistente virtual de Camiseta Futbolera · responde al instante</span>
          </div>
          {mensajes.length > 0 && (
            <button className="chat-head-btn" onClick={nuevaConversacion} title="Empezar una conversación nueva">
              ↻
            </button>
          )}
          <button className="chat-head-btn" onClick={() => setAbierto(false)} aria-label="Cerrar chat">
            ✕
          </button>
        </div>

        <div className="chat-body" ref={cuerpoRef} aria-live="polite">
          <div className="msg bot">
            <p>{BIENVENIDA}</p>
          </div>

          {mensajes.length === 0 && (
            <div className="chat-sugerencias">
              {sugerencias.map((s) => (
                <button key={s} onClick={() => enviar(s)} disabled={escribiendo}>
                  {s}
                </button>
              ))}
            </div>
          )}

          {mensajes.map((m, i) => {
            if (m.role === "assistant" && m.content === "") return null;
            if (m.role === "user") {
              return (
                <div key={i} className="msg user">
                  {m.content}
                </div>
              );
            }
            const { texto: t, acciones } = partir(m.content);
            return (
              <Fragment key={i}>
                {t.trim() && (
                  <div className="msg bot">
                    <Formateado texto={t} />
                  </div>
                )}
                {acciones.length > 0 && <Acciones acciones={acciones} onAgregar={agregar} />}
              </Fragment>
            );
          })}

          {esperandoPrimerTexto && (
            <div className="msg bot chat-escribiendo" aria-label="El asistente está escribiendo">
              <span />
              <span />
              <span />
            </div>
          )}

          {error && (
            <div className="chat-error" role="alert">
              <span>{error.mensaje}</span>
              <div>
                <button onClick={() => enviar(error.pendiente)}>Reintentar</button>
                <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">
                  WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>

        <form
          className="chat-input"
          onSubmit={(e) => {
            e.preventDefault();
            enviar(texto);
          }}
        >
          <textarea
            ref={inputRef}
            rows={1}
            placeholder="Escribe tu pregunta…"
            aria-label="Tu mensaje"
            value={texto}
            maxLength={MAX_MENSAJE}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                enviar(texto);
              }
            }}
          />
          {escribiendo ? (
            <button type="button" onClick={() => abortRef.current?.abort()} aria-label="Detener respuesta" title="Detener">
              ■
            </button>
          ) : (
            <button type="submit" disabled={!texto.trim()} aria-label="Enviar mensaje">
              ➤
            </button>
          )}
        </form>
        <p className="chat-nota">
          Respuestas generadas con IA; pueden tener errores. Para pedidos ya hechos, escríbenos por{" "}
          <a href={WHATSAPP} target="_blank" rel="noopener noreferrer">
            WhatsApp
          </a>
          .
        </p>
      </div>
    </>
  );
}
