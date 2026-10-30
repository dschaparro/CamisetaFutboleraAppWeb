import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // El pill de Next DevTools no admite isotipo propio; se oculta (los errores siguen saliendo).
  // Docs: https://nextjs.org/docs/app/api-reference/config/next-config-js/devIndicators
  devIndicators: false,
  // next dev bloquea orígenes distintos a localhost; ngrok necesita estar permitido.
  // Docs: https://nextjs.org/docs/app/api-reference/config/next-config-js/allowedDevOrigins
  allowedDevOrigins: ["*.ngrok-free.app", "*.ngrok-free.dev", "*.ngrok.io"],
};

export default nextConfig;
