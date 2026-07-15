import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
      {
        protocol: 'https',
        hostname: 'placehold.co',
      }
    ],
  },
  async redirects() {
    return [
      {
        source: '/demo',
        destination: '/embed/armado/M00001?cameraOverlay=off&lightingEditor=off',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
