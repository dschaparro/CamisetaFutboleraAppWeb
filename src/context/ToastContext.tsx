"use client";

import Link from "next/link";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { IconoAlerta, IconoCheck, IconoCerrar, IconoInfo } from "@/components/icons/pago";

export type ToastVariant = "ok" | "error" | "info";

export type ToastInput = {
  titulo: string;
  detalle?: string;
  variant?: ToastVariant;
  href?: string;
  hrefLabel?: string;
  ms?: number;
};

type Toast = ToastInput & { id: number; variant: ToastVariant };

type ToastContextValue = {
  toast: (input: ToastInput) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

function Icono({ variant }: { variant: ToastVariant }) {
  if (variant === "ok") return <IconoCheck size={16} />;
  if (variant === "error") return <IconoAlerta size={16} />;
  return <IconoInfo size={16} />;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [aviso, setAviso] = useState<Toast | null>(null);

  useEffect(() => {
    if (!aviso) return;
    const t = setTimeout(() => setAviso(null), aviso.ms ?? 4200);
    return () => clearTimeout(t);
  }, [aviso]);

  const toast = useCallback((input: ToastInput) => {
    setAviso({
      id: Date.now(),
      variant: input.variant ?? "info",
      ms: input.ms,
      titulo: input.titulo,
      detalle: input.detalle,
      href: input.href,
      hrefLabel: input.hrefLabel,
    });
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {aviso && (
        <div className={`toast toast-${aviso.variant}`} role="status" aria-live="polite" key={aviso.id}>
          <span className={`toast-ico toast-ico-${aviso.variant}`} aria-hidden="true">
            <Icono variant={aviso.variant} />
          </span>
          <div className="toast-texto">
            <b>{aviso.titulo}</b>
            {aviso.detalle ? <span>{aviso.detalle}</span> : null}
          </div>
          {aviso.href && (
            <Link href={aviso.href} className="toast-link" onClick={() => setAviso(null)}>
              {aviso.hrefLabel ?? "Ver"}
            </Link>
          )}
          <button type="button" className="toast-cerrar" aria-label="Cerrar aviso" onClick={() => setAviso(null)}>
            <IconoCerrar size={16} />
          </button>
        </div>
      )}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast debe usarse dentro de <ToastProvider>");
  return ctx;
}
