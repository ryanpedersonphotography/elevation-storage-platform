import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@monorepo/ui", "@monorepo/puck-blocks"],
};

export default nextConfig;
