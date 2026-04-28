import type { NextConfig } from "next";

const BACKEND = process.env.BACKEND_URL ?? "https://github-tracker-9ne3.onrender.com";

const nextConfig: NextConfig = {
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
