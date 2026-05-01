import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
  {
    protocol: "https",
    hostname: "*.supabase.co",
  },
  {
    protocol: "https",
    hostname: "picsum.photos",
  },
  {
    protocol: "https",
    hostname: "example.com", // 👈 agregá esto mientras tenés datos de prueba
  },
],
  },
};

export default nextConfig;
