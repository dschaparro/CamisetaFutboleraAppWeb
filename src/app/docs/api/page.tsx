import Link from "next/link";
import SwaggerUi from "./SwaggerUi";

export default function DocsApiPage() {
  return (
    <>
      <header className="docs-api-bar">
        <div className="docs-api-bar-inner">
          <div>
            <p className="docs-api-eyebrow">Documentación</p>
            <h1>API Camiseta Futbolera</h1>
            <p className="docs-api-note">
              OpenAPI 3 · spec en{" "}
              <a href="/openapi.yaml" target="_blank" rel="noreferrer">
                /openapi.yaml
              </a>
            </p>
          </div>
          <nav className="docs-api-nav">
            <Link href="/">Tienda</Link>
            <Link href="/panel/login">Panel</Link>
          </nav>
        </div>
      </header>
      <SwaggerUi />
    </>
  );
}
