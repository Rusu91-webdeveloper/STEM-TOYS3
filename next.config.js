// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Don't block production builds even with ESLint errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "placehold.co",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
      },
      {
        protocol: "https",
        hostname: "utfs.io",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  typescript: {
    // Don't block production builds even with TypeScript errors
    ignoreBuildErrors: true,
  },
};

module.exports = nextConfig;
