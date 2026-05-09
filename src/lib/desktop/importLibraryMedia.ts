import type { Asset } from "@/lib/assets/assetTypes";
import { useAssetStore } from "@/lib/assets/assetStore";
import { useProjectStore } from "@/lib/projects/projectStore";

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `asset-${Date.now()}`;
}

function kindFromPath(absPath: string): Asset["kind"] {
  const lower = absPath.toLowerCase();
  if (/\.(png|jpg|jpeg|webp|gif|bmp|tiff)$/.test(lower)) return "image";
  if (/\.(mp4|webm|mov|mkv)$/.test(lower)) return "video";
  if (/\.(mp3|wav|ogg|flac)$/.test(lower)) return "audio";
  return "unknown";
}

export async function importDesktopMediaIntoCurrentProject(): Promise<{
  ok: boolean;
  message: string;
}> {
  const d = typeof window !== "undefined" ? window.omfDesktop : undefined;
  if (!d?.pickMediaFiles || !d.copyFilesIntoDir) {
    return { ok: false, message: "Desktop filesystem bridge is not available." };
  }
  const { currentProjectId, projects } = useProjectStore.getState();
  const project =
    currentProjectId ?
      projects.find((p) => p.id === currentProjectId)
    : undefined;
  if (!project?.diskFolderName) {
    return {
      ok: false,
      message:
        "Open a project from Projects — desktop mode assigns an on-disk folder per project.",
    };
  }
  const ws = await d.workspaceGet();
  if (!ws?.trim()) {
    return { ok: false, message: "Choose a workspace folder in Settings first." };
  }
  const destDir = await d.joinPath(ws, project.diskFolderName, "imports");
  await d.ensureDir(destDir);
  const picked = await d.pickMediaFiles();
  if (picked.length === 0) {
    return { ok: true, message: "No files selected." };
  }
  const { copied } = await d.copyFilesIntoDir(picked, destDir);
  const now = new Date().toISOString();
  for (const absPath of copied) {
    const label = absPath.split(/[/\\]/).pop() ?? "import";
    const uri =
      absPath.startsWith("/") || /^[A-Za-z]:\\/.test(absPath) ?
        `file://${absPath}`
      : absPath;
    const asset: Asset = {
      id: newId(),
      projectId: project.id,
      kind: kindFromPath(absPath),
      role: "input",
      label,
      uri,
      local: true,
      rightsStatus: "unknown",
      createdAt: now,
      updatedAt: now,
    };
    useAssetStore.getState().upsertAsset(asset);
  }
  return {
    ok: true,
    message: `Copied ${copied.length} file(s) into the project imports folder.`,
  };
}
