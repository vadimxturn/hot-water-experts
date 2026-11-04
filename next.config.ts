import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  images: {
    unoptimized: true,
  },
  async redirects() {
    return [
      { source: "/booked", destination: "/thank-you", permanent: false },
    ];
  },
};

export default nextConfig;
