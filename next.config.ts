import type { NextConfig } from "next";

const isVercel = Boolean(process.env.VERCEL);

const nextConfig: NextConfig = {
  reactStrictMode: true,
  serverExternalPackages: ["@react-pdf/renderer"],
  ...(isVercel ? {} : { output: "standalone" }),
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
};

export default nextConfig;
