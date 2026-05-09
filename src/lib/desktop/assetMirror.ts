import { useAssetStore } from "@/lib/assets/assetStore";
import type { Asset } from "@/lib/assets/assetTypes";
import type { GenerationJob } from "@/lib/jobs/jobTypes";
import { useProjectStore } from "@/lib/projects/projectStore";

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]!);
  }
  return btoa(binary);
}

/**
 * Copy remote Comfy/view URLs into the project disk folder on desktop builds.
 */
export async function mirrorRemoteOutputsForJobDesktop(
  job: GenerationJob,
  assets: Asset[],
): Promise<void> {
  const d = typeof window !== "undefined" ? window.omfDesktop : undefined;
  if (!d?.workspaceGet || !job.projectId) return;

  const project = useProjectStore
    .getState()
    .projects.find((p) => p.id === job.projectId);
  const ws = await d.workspaceGet();
  if (!ws || !project?.diskFolderName) return;

  const outDir = await d.joinPath(ws, project.diskFolderName, "outputs");
  await d.ensureDir(outDir);

  for (const asset of assets) {
    if (!asset.uri.startsWith("http://") && !asset.uri.startsWith("https://")) {
      continue;
    }
    try {
      const res = await fetch(asset.uri);
      if (!res.ok) continue;
      const mime = res.headers.get("content-type") ?? asset.mimeType ?? "";
      const ext =
        mime.includes("png") ? "png"
        : mime.includes("jpeg") || mime.includes("jpg") ? "jpg"
        : mime.includes("webp") ? "webp"
        : "bin";
      const fname = `${asset.id.slice(0, 12)}.${ext}`;
      const absPath = await d.joinPath(outDir, fname);
      const buf = await res.arrayBuffer();
      await d.writeBufferFile(absPath, arrayBufferToBase64(buf));
      const fileUri = absPath.startsWith("/") ? `file://${absPath}` : absPath;
      useAssetStore.getState().upsertAsset({
        ...asset,
        uri: fileUri,
        local: true,
      });
    } catch {
      /* keep remote URI */
    }
  }
}
