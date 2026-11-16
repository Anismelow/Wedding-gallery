import type { NextConfig } from "next";

// Dirección del backend (Spring Boot). En desarrollo es localhost:8080;
// en otra máquina se cambia con la variable de entorno BACKEND_URL.
const backendUrl = process.env.BACKEND_URL ?? "http://localhost:8080";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Todo lo que empiece por /api se reenvía al backend. Así el navegador
  // solo habla con UN origen: la cookie de acceso viaja sola y no hace
  // falta configurar CORS.
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
