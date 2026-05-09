/**
 * electron-builder afterPack: copy the full Next.js standalone tree into
 * resources/omf-next. extraResources alone omits node_modules on this path.
 * @param {any} context
 */
export default async function afterPack(context) {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const src = path.join(context.packager.projectDir, ".next", "standalone");
  const dest = path.join(context.appOutDir, "resources", "omf-next");
  if (!fs.existsSync(path.join(src, "server.js"))) {
    throw new Error(
      `[afterPack] Missing Next standalone at ${src} — run npm run build first.`,
    );
  }
  fs.rmSync(dest, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.cpSync(src, dest, { recursive: true });
}
