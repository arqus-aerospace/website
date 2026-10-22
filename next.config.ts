import type { NextConfig } from "next";

// Set when serving from a sub-path, e.g. "/website" on <org>.github.io/website.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
