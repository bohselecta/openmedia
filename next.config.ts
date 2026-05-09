import type { NextConfig } from "next";
import { readFileSync } from "fs";
import { join } from "path";

const pkg = JSON.parse(
  readFileSync(join(__dirname, "package.json"), "utf8"),
) as { version: string };

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_OMF_APP_VERSION: pkg.version,
  },
  ...(process.env.OMF_STANDALONE === "1" ?
    { output: "standalone" as const }
  : {}),
  /** Electron loads the dev server via 127.0.0.1 — allow HMR/WebSocket in dev. */
  allowedDevOrigins: ["127.0.0.1"],
};

export default nextConfig;
