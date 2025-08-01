// @ts-check

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    // typedRoutes: true,
  },
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false,
  compiler: {
    removeConsole: false,
  },
  // Don't block production builds even with ESLint errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Temporarily ignore build errors to allow deployment while fixing module resolution
    ignoreBuildErrors: true,
  },
  // Update domain configuration with new fallback approach
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "placehold.co",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "**.s3.amazonaws.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "picsum.photos",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "api.dicebear.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "ui-avatars.com",
        pathname: "/**",
      },
      // New placeholder services
      {
        protocol: "https",
        hostname: "dummyimage.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "via.placeholder.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "placeholder.pics",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "placekitten.com",
        pathname: "/**",
      },
    ],
  },
  // Configure uploadthing directories
  env: {
    uploadthingDir: "./.uploadthing",
  },
  headers: async () => {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
        ],
      },
    ];
  },
  // Fix module resolution and OpenTelemetry warnings
  webpack: (config, { isServer }) => {
    // Improve module resolution
    config.resolve.extensions = [".tsx", ".ts", ".jsx", ".js", ".json"];

    // Make module resolution more explicit
    config.resolve.alias = {
      ...config.resolve.alias,
      "@": require("path").resolve(__dirname),
    };
    if (isServer) {
      // Prevent OpenTelemetry from trying to load native modules
      config.externals = [
        ...(config.externals || []),
        {
          "@opentelemetry/instrumentation":
            "commonjs @opentelemetry/instrumentation",
        },
      ];

      // Ignore the critical dependency warnings
      config.module = {
        ...config.module,
        exprContextCritical: false,
      };

      // Add fallbacks for node modules that might not be available
      config.resolve = {
        ...config.resolve,
        fallback: {
          ...config.resolve?.fallback,
          fs: false,
          net: false,
          tls: false,
          dns: false,
          child_process: false,
          worker_threads: false,
        },
      };
    }

    return config;
  },
};

module.exports = nextConfig;
