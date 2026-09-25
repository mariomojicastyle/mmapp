import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
  async rewrites() {
    return [
      {
        source: '/comercial',
        destination: '/comercial/comercial.html',
      },
      {
        source: '/comercial/',
        destination: '/comercial/comercial.html',
      },
    ];
  },
};

export default nextConfig;
