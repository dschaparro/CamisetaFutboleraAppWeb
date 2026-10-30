import type { Metadata } from "next";
import Script from "next/script";
import { ConfirmProvider } from "@/context/ConfirmContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "Camiseta Futbolera",
  description:
    "Plataforma web de comercio electrónico con componente ERP e inteligencia artificial para Camiseta Futbolera.",
  icons: {
    icon: [{ url: "/icono.jpeg", type: "image/jpeg" }],
    apple: [{ url: "/icono.jpeg", type: "image/jpeg" }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      {/* Extensiones del navegador (p. ej. ColorZilla) inyectan atributos en body y disparan hydration warning. */}
      <body suppressHydrationWarning>
        {/* beforeInteractive: aplica el tema antes de hidratar (sin <script> crudo en el árbol React). */}
        <Script
          id="cf-theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem('theme');if(t==='light'||t==='dark'){document.documentElement.setAttribute('data-theme',t);}}catch(e){}`,
          }}
        />
        <ConfirmProvider>{children}</ConfirmProvider>
      </body>
    </html>
  );
}
