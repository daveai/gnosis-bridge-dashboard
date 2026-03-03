import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  basePath: "/gnosis-bridge-dashboard",
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
