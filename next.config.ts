import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  ...(process.env.OMF_STANDALONE === "1" ?
    { output: "standalone" as const }
  : {}),
  /** Electron loads the dev server via 127.0.0.1 — allow HMR/WebSocket in dev. */
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
