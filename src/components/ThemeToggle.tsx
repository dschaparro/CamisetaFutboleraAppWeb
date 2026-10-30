"use client";

import { useEffect, useState } from "react";
import { IconoLuna, IconoSol } from "@/components/icons/pago";

/** Solo en cliente: localStorage / data-theme / prefers-color-scheme. */
function leerTema(): "light" | "dark" {
  const attr = document.documentElement.getAttribute("data-theme");
  if (attr === "light" || attr === "dark") return attr;
  try {
    const stored = window.localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* sin storage */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export default function ThemeToggle() {
  // SSR y primer paint del cliente: mismo valor → sin mismatch de hidratación.
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    setTheme(leerTema());
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try {
      window.localStorage.setItem("theme", next);
    } catch {
      /* sin storage */
    }
  }

  const oscuro = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={oscuro ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={oscuro ? "Tema oscuro (clic para claro)" : "Tema claro (clic para oscuro)"}
    >
      {oscuro ? <IconoSol size={18} /> : <IconoLuna size={18} />}
    </button>
  );
}
