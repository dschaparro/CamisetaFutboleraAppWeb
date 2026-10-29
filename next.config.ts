import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Indicador de desarrollo a la izquierda: a la derecha tapa el botón de GOALIX.
  devIndicators: { position: "bottom-left" },
  // next dev bloquea orígenes distintos a localhost; ngrok necesita estar permitido.
  // Docs: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok-free.dev", "*.ngrok.io"],
};

export default nextConfig;
