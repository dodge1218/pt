import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: process.cwd(),
  experimental: {
    // Enable PPR for faster initial loads
    // ppr: true,
  },
};

export default nextConfig;
