import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "API · Camiseta Futbolera",
  description: "Documentación OpenAPI / Swagger de los Route Handlers.",
  robots: { index: false, follow: false },
};

export default function DocsApiLayout({ children }: { children: React.ReactNode }) {
  return <div className="docs-api-shell">{children}</div>;
}
