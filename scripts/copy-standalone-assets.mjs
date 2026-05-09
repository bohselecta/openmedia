/**
 * After `OMF_STANDALONE=1 next build`, copy static assets into the standalone
 * server root so production Next can serve chunks and public files.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const standalone = path.join(root, ".next", "standalone");
const serverJs = path.join(standalone, "server.js");

if (!fs.existsSync(serverJs)) {
  console.error(
    "[copy-standalone-assets] Missing .next/standalone/server.js — run with OMF_STANDALONE=1 next build.",
  );
  process.exit(1);
}

const staticSrc = path.join(root, ".next", "static");
const staticDest = path.join(standalone, ".next", "static");
const publicSrc = path.join(root, "public");
const publicDest = path.join(standalone, "public");

fs.mkdirSync(path.dirname(staticDest), { recursive: true });
if (fs.existsSync(staticSrc)) {
  fs.cpSync(staticSrc, staticDest, { recursive: true });
  console.log("[copy-standalone-assets] synced .next/static → standalone/.next/static");
} else {
  console.warn("[copy-standalone-assets] no .next/static — skipped");
}

if (fs.existsSync(publicSrc)) {
  fs.cpSync(publicSrc, publicDest, { recursive: true });
  console.log("[copy-standalone-assets] synced public → standalone/public");
}
