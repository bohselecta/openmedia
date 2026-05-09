/**
 * Desktop project folders under the workspace root.
 */

export function sanitizeDiskFolderName(raw: string): string {
  const s = raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return s || "project";
}

export function defaultDiskFolderForProject(
  title: string,
  projectId: string,
): string {
  const base = sanitizeDiskFolderName(title);
  const short = projectId.replace(/[^a-zA-Z0-9]/g, "").slice(-6);
  return `${base}-${short || "id"}`;
}
