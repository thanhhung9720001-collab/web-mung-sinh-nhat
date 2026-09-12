import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // 30 MB video + 5 MB avatar + a small multipart overhead allowance.
      bodySizeLimit: "36mb",
    },
  },
};

export default nextConfig;
