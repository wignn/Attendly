import nextConfig from "@komas/eslint-config/next.js";

export default [
  ...nextConfig,
  {
    ignores: [".next/*", "node_modules/*"]
  }
];
