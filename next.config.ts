import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Remove the experimental { turbo: ... } block if it exists
  reactStrictMode: true,
};

export default nextConfig;