import type { NextConfig } from "next";

const BACKEND = process.env.BACKEND_URL ?? "https://github-tracker-9ne3.onrender.com";

const nextConfig: NextConfig = {
  // Prevent Next.js from trying to bundle Node.js-only packages
  // that are listed in root package.json but belong to the backend
  serverExternalPackages: ["express", "pg", "prisma", "@prisma/client", "cors", "nodemon"],

  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${BACKEND}/:path*`,
      },
    ];
  },
};

export default nextConfig;
