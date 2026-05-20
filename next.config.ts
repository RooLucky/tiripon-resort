import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "tvgniohqrefdxopvwepg.supabase.co",
      },
    ],
  },
};

export default nextConfig;
