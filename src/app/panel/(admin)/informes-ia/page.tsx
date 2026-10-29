"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import {
  IconoAlerta,
  IconoCaja,
  IconoCamiseta,
  IconoCheck,
  IconoCerrar,
  IconoCopiar,
  IconoDescargar,
  IconoDestello,
  IconoDinero,
  IconoGrafico,
  IconoPedido,
} from "@/components/icons/pago";
import s from "./informes.module.css";

type Kpi = { etiqueta: string; valor: string };
type Seccion = { titulo: string; texto: string; alerta: boolean };
type Informe = {
  titulo: string;
  kpis: Kpi[];
  secciones: Seccion[];
  generadoEn: string;
  fuenteDatos: "ejemplo" | "sistema";
};
type InformeGuardado = Informe & { solicitud: string };

const MAX_SOLICITUD = 1000;
const MAX_HISTORIAL = 5;

const SUGERENCIAS: { icono: ReactNode; texto: string }[] = [
  { icono: <IconoGrafico size={14} />, texto: "Ventas y margen del último mes" },
  { icono: <IconoCamiseta size={14} />, texto: "Productos más vendidos por club" },
  { icono: <IconoCaja size={14} />, texto: "Estado de la Lista de Compras" },
  { icono: <IconoDinero size={14} />, texto: "Comparativo de márgenes web vs. venta manual" },
  { icono: <IconoAlerta size={14} />, texto: "Productos agotados o con poco stock" },
  { icono: <IconoPedido size={14} />, texto: "Pedidos pendientes de pago o de envío" },
];

// Se van mostrando mientras la IA trabaja, para que la espera no parezca congelada.
const PASOS_CARGA = [
  "Leyendo ventas y pedidos…",
  "Revisando inventario y márgenes…",
  "Analizando la Lista de Compras…",
  "Redactando el informe…",
];

const SOLICITUD_INICIAL =
  "Hazme un resumen de ventas y margen del último mes, destacando los productos con mejor rentabilidad";

function haceCuanto(iso: string, ahora: number): string {
  const seg = Math.max(0, Math.round((ahora - new Date(iso).getTime()) / 1000));
  if (seg < 45) return "hace unos segundos";
  const min = Math.round(seg / 60);
  if (min < 60) return `hace ${min} min`;
  return new Date(iso).toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" });
}

function informeComoTexto(inf: Informe): string {
  const kpis = inf.kpis.map((k) => `• ${k.etiqueta}: ${k.valor}`).join("\n");
  const secciones = inf.secciones
    .map((sec) => `${sec.alerta ? "[Atención] " : ""}${sec.titulo}\n${sec.texto}`)
    .join("\n\n");
  return `${inf.titulo}\n\n${kpis}\n\n${secciones}`;
}

export default function InformesIaPage() {
  const [solicitud, setSolicitud] = useState(SOLICITUD_INICIAL);
  const [cargando, setCargando] = useState(false);
  const [informe, setInforme] = useState<InformeGuardado | null>(null);
  const [historial, setHistorial] = useState<InformeGuardado[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ahora, setAhora] = useState(() => Date.now());
  const [inicioCarga, setInicioCarga] = useState<number | null>(null);
  const [copiado, setCopiado] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Refresca el "hace X" mientras haya un informe en pantalla.
  useEffect(() => {
    if (!informe) return;
    const id = setInterval(() => setAhora(Date.now()), 15_000);
    return () => clearInterval(id);
  }, [informe]);

  // Mientras carga, avanza el reloj cada segundo (contador y pasos).
  useEffect(() => {
    if (!cargando) return;
    const id = setInterval(() => setAhora(Date.now()), 1000);
    return () => clearInterval(id);
  }, [cargando]);

  useEffect(() => () => abortRef.current?.abort(), []);

  const segundos = cargando && inicioCarga ? Math.max(0, Math.floor((ahora - inicioCarga) / 1000)) : 0;
  const paso = PASOS_CARGA[Math.min(PASOS_CARGA.length - 1, Math.floor(segundos / 4))];
  const alertas = informe ? informe.secciones.filter((sec) => sec.alerta).length : 0;

  async function generar() {
    const texto = solicitud.trim();
    if (!texto || cargando) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setCargando(true);
    setError(null);
    setInicioCarga(Date.now());
    setAhora(Date.now());

    try {
      const res = await fetch("/api/informes", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ solicitud: texto }),
        signal: controller.signal,
      });

      let data: { informe?: Informe; error?: { message?: string } } | null = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }

      if (!res.ok || !data?.informe) {
        setError(data?.error?.message ?? "No se pudo generar el informe. Intenta de nuevo.");
        return;
      }

      const nuevo = { ...data.informe, solicitud: texto };
      setInforme(nuevo);
      setHistorial((prev) => [nuevo, ...prev].slice(0, MAX_HISTORIAL));
      setAhora(Date.now());
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") return;
      setError("No hay conexión con el servidor. Revisa que la app siga corriendo e intenta de nuevo.");
    } finally {
      if (abortRef.current === controller) {
        setCargando(false);
        setInicioCarga(null);
      }
    }
  }

  function cancelar() {
    abortRef.current?.abort();
    abortRef.current = null;
    setCargando(false);
    setInicioCarga(null);
  }

  function usarSugerencia(texto: string) {
    setSolicitud(texto);
    textareaRef.current?.focus();
  }

  async function copiar() {
    if (!informe) return;
    try {
      await navigator.clipboard.writeText(informeComoTexto(informe));
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      setError("No se pudo copiar al portapapeles. Usa «Descargar PDF».");
    }
  }

  const pantallaCarga = (
    <div className={s.cargaCaja} role="status">
      <div className={s.cargaFila}>
        <span className="spinner" />
        <b>{paso}</b>
        <span className={s.cargaSeg}>{segundos} s</span>
      </div>
      <p className={s.cargaNota}>Suele tardar entre 10 y 30 segundos.</p>
      <div className={s.esqueleto} aria-hidden="true">
        <div className={s.esqTitulo} />
        <div className={s.esqKpis}>
          <div /> <div /> <div /> <div />
        </div>
        <div className={s.esqLinea} />
        <div className={s.esqLinea} />
        <div className={`${s.esqLinea} ${s.esqCorta}`} />
      </div>
      <button className="btn btn-outline btn-sm" onClick={cancelar}>
        Cancelar
      </button>
    </div>
  );

  return (
    <div className={s.pagina}>
      <div className="admin-topbar">
        <div>
          <h1>Informes con IA</h1>
          <p>Pide un informe en lenguaje natural y la IA lo arma con los datos de la tienda</p>
        </div>
      </div>

      <div className={s.layout}>
        <aside className={`card ${s.panelIzq}`}>
          <label className={s.etiqueta} htmlFor="solicitud">
            ¿Qué informe necesitas?
          </label>
          <p className={s.ayuda}>Escríbelo con tus palabras, como se lo pedirías a una persona.</p>

          <textarea
            id="solicitud"
            ref={textareaRef}
            className={s.textarea}
            value={solicitud}
            maxLength={MAX_SOLICITUD}
            placeholder="Ej.: ¿Qué productos debo reabastecer esta semana?"
            onChange={(e) => setSolicitud(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
                e.preventDefault();
                generar();
              }
            }}
          />
          <div className={s.bajoTexto}>
            <span className={s.atajo}>
              <kbd>Ctrl</kbd> + <kbd>Enter</kbd> para generar
            </span>
            <span className={`${s.contador} ${solicitud.length >= MAX_SOLICITUD ? s.contadorMax : ""}`}>
              {solicitud.length}/{MAX_SOLICITUD}
            </span>
          </div>

          <div className={s.acciones}>
            <button
              className={`btn btn-gold ${s.generar}`}
              onClick={generar}
              disabled={cargando || solicitud.trim().length === 0}
            >
              {cargando ? (
                <>
                  <span className="spinner" /> Generando…
                </>
              ) : (
                <>
                  <IconoDestello size={16} /> Generar informe
                </>
              )}
            </button>
            {solicitud.length > 0 && !cargando && (
              <button className="btn btn-ghost btn-sm" onClick={() => setSolicitud("")}>
                Limpiar
              </button>
            )}
          </div>

          <div className={s.subtitulo}>Ideas para empezar</div>
          <div className={s.chips}>
            {SUGERENCIAS.map((sug) => (
              <button
                key={sug.texto}
                className={`${s.chip} ${solicitud === sug.texto ? s.chipActivo : ""}`}
                onClick={() => usarSugerencia(sug.texto)}
                disabled={cargando}
              >
                <span className={s.chipIcono} aria-hidden="true">
                  {sug.icono}
                </span>
                {sug.texto}
              </button>
            ))}
          </div>

          {historial.length > 0 && (
            <>
              <div className={s.subtitulo}>Recientes de esta sesión</div>
              <ul className={s.historial}>
                {historial.map((h) => (
                  <li key={h.generadoEn}>
                    <button
                      className={`${s.histItem} ${informe?.generadoEn === h.generadoEn ? s.histActivo : ""}`}
                      onClick={() => {
                        setInforme(h);
                        setError(null);
                      }}
                      disabled={cargando}
                      title={h.solicitud}
                    >
                      <b>{h.titulo}</b>
                      <span>{haceCuanto(h.generadoEn, ahora)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </aside>

        <div className={s.resultado} aria-live="polite" aria-busy={cargando}>
          {error && (
            <div className={s.error} role="alert">
              <span>{error}</span>
              <div className={s.errorAcciones}>
                <button className="btn btn-outline btn-sm" onClick={generar} disabled={cargando}>
                  Reintentar
                </button>
                <button className={s.cerrar} onClick={() => setError(null)} aria-label="Cerrar aviso">
                  <IconoCerrar size={14} />
                </button>
              </div>
            </div>
          )}

          {!informe ? (
            cargando ? (
              pantallaCarga
            ) : (
              <div className={s.vacio}>
                <div className={s.vacioIcono} aria-hidden="true">
                  <IconoDestello size={36} />
                </div>
                <b>Tu informe aparecerá aquí</b>
                <ol className={s.pasos}>
                  <li>
                    <span>1</span>Escribe lo que necesitas o elige una idea
                  </li>
                  <li>
                    <span>2</span>Pulsa «Generar informe»
                  </li>
                  <li>
                    <span>3</span>Lee, copia o descarga el resultado en PDF
                  </li>
                </ol>
              </div>
            )
          ) : (
            <article className={`card ${s.report}`}>
              <header className={s.head}>
                <div className={s.headTexto}>
                  <h2>{informe.titulo}</h2>
                  <span className={s.tag}>
                    Generado por el Asistente de IA · {haceCuanto(informe.generadoEn, ahora)}
                  </span>
                  <p className={s.pedido}>«{informe.solicitud}»</p>
                </div>
                <div className={s.headAcciones}>
                  <button className={s.botonClaro} onClick={copiar}>
                    {copiado ? (
                      <>
                        <IconoCheck size={14} /> Copiado
                      </>
                    ) : (
                      <>
                        <IconoCopiar size={14} /> Copiar
                      </>
                    )}
                  </button>
                  <button className={s.botonClaro} onClick={() => window.print()}>
                    <IconoDescargar size={14} /> Descargar PDF
                  </button>
                </div>
              </header>

              <div className={s.body}>
                {alertas > 0 && (
                  <div className={s.resumenAlertas}>
                    <IconoAlerta size={16} />{" "}
                    {alertas === 1 ? "1 punto requiere" : `${alertas} puntos requieren`} tu atención
                  </div>
                )}

                <div className={s.kpis}>
                  {informe.kpis.map((k, i) => (
                    <div className={s.kpi} key={`${k.etiqueta}-${i}`}>
                      <span>{k.etiqueta}</span>
                      <b>{k.valor}</b>
                    </div>
                  ))}
                </div>

                <div className={s.secciones}>
                  {informe.secciones.map((sec, i) => (
                    <section
                      className={`${s.seccion} ${sec.alerta ? s.seccionAlerta : ""}`}
                      key={`${sec.titulo}-${i}`}
                    >
                      <h4>
                        {sec.alerta && (
                          <span aria-hidden="true">
                            <IconoAlerta size={14} />{" "}
                          </span>
                        )}
                        {sec.titulo}
                        {sec.alerta && <span className={s.srOnly}> (requiere atención)</span>}
                      </h4>
                      <p>{sec.texto}</p>
                    </section>
                  ))}
                </div>
              </div>

              <footer className={s.pie}>
                <span>
                  Generado con la API de Claude a partir de los datos del sistema
                  {informe.fuenteDatos === "ejemplo" ? " (datos de ejemplo por ahora)" : ""}. Revisa las
                  cifras antes de tomar decisiones.
                </span>
                <button className="btn btn-outline btn-sm" onClick={generar} disabled={cargando}>
                  ↻ Regenerar
                </button>
              </footer>

              {cargando && <div className={s.capaCarga}>{pantallaCarga}</div>}
            </article>
          )}
        </div>
      </div>
    </div>
  );
}
