import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
    ],
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  // The upload action accepts files up to 20 MB. Leave room for multipart
  // form-data framing so a valid 20 MB file is never rejected by Next first.
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
  reactStrictMode: true,
};

export default nextConfig;
