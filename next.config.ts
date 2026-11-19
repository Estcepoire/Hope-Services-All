import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image Docker légère : serveur Node autonome (voir Dockerfile).
  output: "standalone",
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    // Formulaire d'enlèvement : jusqu'à 4 photos (compressées dans le navigateur, ~300 Ko chacune).
    serverActions: { bodySizeLimit: "8mb" },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
