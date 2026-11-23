"use client";

import { useEffect, useRef } from "react";

declare global {
  interface Window {
    ui?: unknown;
  }
}

/** Carga Swagger UI desde CDN (sin dependencia npm). */
export default function SwaggerUi() {
  const host = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const cssId = "swagger-ui-css";
    if (!document.getElementById(cssId)) {
      const link = document.createElement("link");
      link.id = cssId;
      link.rel = "stylesheet";
      link.href = "https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui.css";
      document.head.appendChild(link);
    }

    let cancelled = false;
    const script = document.createElement("script");
    script.src = "https://unpkg.com/swagger-ui-dist@5.17.14/swagger-ui-bundle.js";
    script.async = true;
    script.onload = () => {
      if (cancelled || !host.current) return;
      const SwaggerUIBundle = (window as unknown as { SwaggerUIBundle: (opts: object) => unknown }).SwaggerUIBundle;
      if (!SwaggerUIBundle) return;
      window.ui = SwaggerUIBundle({
        url: "/openapi.yaml",
        domNode: host.current,
        deepLinking: true,
        docExpansion: "list",
        defaultModelsExpandDepth: 1,
        tryItOutEnabled: true,
        persistAuthorization: true,
      });
    };
    document.body.appendChild(script);

    return () => {
      cancelled = true;
      script.remove();
    };
  }, []);

  return <div ref={host} className="swagger-host" />;
}
