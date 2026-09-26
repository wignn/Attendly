import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output:
    process.env.NEXT_OUTPUT === "standalone" ||
    (process.env.NODE_ENV === "production" && process.platform !== "win32")
      ? "standalone"
      : undefined,
  transpilePackages: ["@komas/ui", "@komas/shared-types"],
  reactStrictMode: true,
};

export default nextConfig;
