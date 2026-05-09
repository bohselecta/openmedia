/**
 * electron-builder afterAllArtifactBuild: add a shell launcher next to each AppImage
 * so double-click / menu users get --no-sandbox without typing flags.
 * @param {any} context
 */
export default async function afterAllArtifactBuild(context) {
  const fs = await import("node:fs");
  const path = await import("node:path");
  const paths = context.artifactPaths || [];
  for (const appImage of paths) {
    if (!appImage.endsWith(".AppImage")) continue;
    const launcher = appImage.replace(/\.AppImage$/i, "-launch.sh");
    const base = path.basename(appImage);
    const script = `#!/usr/bin/env bash
set -e
DIR="$(cd "$(dirname "\${BASH_SOURCE[0]}")" && pwd)"
exec "$DIR/${base}" --no-sandbox --disable-setuid-sandbox "$@"
`;
    fs.writeFileSync(launcher, script, { encoding: "utf8", mode: 0o755 });
  }
}
