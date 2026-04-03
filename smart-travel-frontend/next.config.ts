import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.pexels.com',
      },
      {
        // Mapillary serves photo thumbnails from scontent CDN
        protocol: 'https',
        hostname: 'scontent-*.xx.fbcdn.net',
      },
      {
        // Mapillary direct CDN
        protocol: 'https',
        hostname: '*.mapillary.com',
      },
      {
        // Wikimedia Commons (fallback images)
        protocol: 'https',
        hostname: 'upload.wikimedia.org',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          {
            key: 'Service-Worker-Allowed',
            value: '/',
          },
          {
            key: 'Cache-Control',
            value: 'no-cache, no-store, must-revalidate',
          },
        ],
      },
    ];
  },
};

export default nextConfig;

