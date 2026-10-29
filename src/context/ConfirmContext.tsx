"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";

export type ConfirmOpciones = {
  titulo: string;
  mensaje?: string;
  confirmarLabel?: string;
  cancelarLabel?: string;
  /** Resalta la acción de confirmar (p. ej. vaciar / eliminar). */
  peligro?: boolean;
};

type Pendiente = ConfirmOpciones & {
  resolve: (ok: boolean) => void;
};

type ConfirmContextValue = {
  confirmar: (opciones: ConfirmOpciones) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [pendiente, setPendiente] = useState<Pendiente | null>(null);
  const pendienteRef = useRef<Pendiente | null>(null);
  const tituloId = useId();
  const mensajeId = useId();
  const cancelarRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    pendienteRef.current = pendiente;
  }, [pendiente]);

  const confirmar = useCallback((opciones: ConfirmOpciones) => {
    return new Promise<boolean>((resolve) => {
      setPendiente({ ...opciones, resolve });
    });
  }, []);

  const cerrar = useCallback((ok: boolean) => {
    const actual = pendienteRef.current;
    if (!actual) return;
    actual.resolve(ok);
    setPendiente(null);
  }, []);

  useEffect(() => {
    if (!pendiente) return;
    cancelarRef.current?.focus();
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        cerrar(false);
      }
    }
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [pendiente, cerrar]);

  return (
    <ConfirmContext.Provider value={{ confirmar }}>
      {children}
      {pendiente ? (
        <div className="modal-fondo" role="presentation" onClick={() => cerrar(false)}>
          <div
            className="modal modal-confirm"
            role="alertdialog"
            aria-modal="true"
            aria-labelledby={tituloId}
            aria-describedby={pendiente.mensaje ? mensajeId : undefined}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 id={tituloId}>{pendiente.titulo}</h2>
            {pendiente.mensaje ? (
              <p id={mensajeId} className="modal-sub">
                {pendiente.mensaje}
              </p>
            ) : null}
            <div className="modal-acciones">
              <button ref={cancelarRef} type="button" className="btn btn-outline" onClick={() => cerrar(false)}>
                {pendiente.cancelarLabel ?? "Cancelar"}
              </button>
              <button
                type="button"
                className={pendiente.peligro ? "btn btn-danger" : "btn btn-gold"}
                onClick={() => cerrar(true)}
              >
                {pendiente.confirmarLabel ?? "Confirmar"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext);
  if (!ctx) throw new Error("useConfirm debe usarse dentro de <ConfirmProvider>");
  return ctx;
}
