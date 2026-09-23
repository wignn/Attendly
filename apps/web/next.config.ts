import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  transpilePackages: ["@komas/ui", "@komas/shared-types"],
  reactStrictMode: true,
};

export default nextConfig;
