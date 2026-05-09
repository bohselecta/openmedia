import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.OMF_STANDALONE === "1" ?
    { output: "standalone" as const }
  : {}),
};

export default nextConfig;
