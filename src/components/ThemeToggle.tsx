"use client";

import { useEffect, useState } from "react";

/**
 * Selector de tema claro/oscuro.
 * - Al cargar, respeta lo que el usuario eligió antes (localStorage) o,
 *   si nunca eligió nada, el tema del sistema operativo.
 * - Al hacer clic, fija el tema elegido en <html data-theme="..."> y lo
 *   recuerda en localStorage para la próxima visita.
 * - El script inline en layout.tsx aplica el valor guardado ANTES de pintar
 *   la página, para que no se vea un parpadeo del tema equivocado.
 */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark" | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
    } else {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      setTheme(prefersDark ? "dark" : "light");
    }
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    window.localStorage.setItem("theme", next);
  }

  // Evita renderizar un ícono "equivocado" un instante antes de saber el tema real.
  if (theme === null) {
    return <button className="theme-toggle" aria-label="Cambiar tema" disabled />;
  }

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={toggle}
      aria-label={theme === "dark" ? "Cambiar a tema claro" : "Cambiar a tema oscuro"}
      title={theme === "dark" ? "Tema oscuro (clic para claro)" : "Tema claro (clic para oscuro)"}
    >
      {theme === "dark" ? "☀️" : "🌙"}
    </button>
  );
}
