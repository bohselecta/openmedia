"use client";

import type { AssetMapEntry } from "@/lib/assetMap/assetMapTypes";
import type { Asset } from "@/lib/assets/assetTypes";
import type { GenerationJob } from "@/lib/jobs/jobTypes";
import type { CredentialRef } from "@/lib/providers/types";
import type { ProviderConfig } from "@/lib/providers/types";
import type { ProviderRunLogEntry } from "@/lib/providers/providerRunLog";
import {
  buildProjectPacket,
  projectPacketToJson,
} from "@/lib/export/projectPacket";
import {
  packetJsonLikelyContainsSecretMaterial,
  parseProjectPacketJson,
} from "@/lib/export/projectPacketSchema";
import type { Project } from "@/lib/projects/projectTypes";
import type { GenerationReceipt } from "@/lib/receipts/receiptTypes";
import type { SavedPrompt, StoryboardShot } from "@/lib/workspace/workspaceTypes";

function fileUriToAbsolute(uri: string): string | null {
  if (uri.startsWith("file://")) {
    return uri.slice("file://".length);
  }
  if (uri.startsWith("/")) return uri;
  return null;
}

function extFromMime(m?: string): string {
  if (!m) return ".bin";
  if (m.includes("png")) return ".png";
  if (m.includes("jpeg") || m.includes("jpg")) return ".jpg";
  if (m.includes("webp")) return ".webp";
  if (m.includes("mp4")) return ".mp4";
  return ".bin";
}

export async function exportDesktopProjectZip(params: {
  project: Project;
  assets: Asset[];
  assetMap: AssetMapEntry[];
  jobs: GenerationJob[];
  receipts: GenerationReceipt[];
  shots: StoryboardShot[];
  prompts: SavedPrompt[];
  credentials: CredentialRef[];
  appVersion?: string;
  providerRunLog?: ProviderRunLogEntry[];
  providerConfigs?: ProviderConfig[];
}): Promise<{ ok: boolean; zipPath?: string; error?: string }> {
  const d = typeof window !== "undefined" ? window.omfDesktop : undefined;
  if (!d?.exportZip || !params.project.diskFolderName) {
    return {
      ok: false,
      error: "ZIP export needs the desktop app and a project disk folder.",
    };
  }
  const ws = await d.workspaceGet();
  if (!ws?.trim()) {
    return { ok: false, error: "Choose a workspace folder in Settings first." };
  }
  const exportDir = await d.joinPath(
    ws,
    params.project.diskFolderName,
    "exports",
  );
  await d.ensureDir(exportDir);
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const packet = buildProjectPacket({
    project: params.project,
    assets: params.assets,
    assetMap: params.assetMap,
    jobs: params.jobs,
    receipts: params.receipts,
    shots: params.shots,
    prompts: params.prompts,
    credentials: params.credentials,
    appVersion: params.appVersion,
    providerRunLog: params.providerRunLog,
    providerConfigs: params.providerConfigs,
  });
  const json = projectPacketToJson(packet);
  const leak = packetJsonLikelyContainsSecretMaterial(json);
  if (leak) {
    return { ok: false, error: `Refusing ZIP: packet audit failed (${leak}).` };
  }
  const parsed = parseProjectPacketJson(json);
  if (!parsed.ok) {
    return { ok: false, error: `Packet schema validation failed: ${parsed.error}` };
  }
  const packetPath = await d.joinPath(exportDir, `packet-${stamp}.json`);
  await d.writeTextFile(packetPath, json);

  const entries: Array<{ absPath: string; arcName: string }> = [
    { absPath: packetPath, arcName: `packet-${stamp}.json` },
  ];

  const projectAssets = params.assets.filter(
    (a) => a.projectId === params.project.id,
  );
  for (const a of projectAssets) {
    const abs = fileUriToAbsolute(a.uri);
    if (!abs) continue;
    const ext = extFromMime(a.mimeType);
    entries.push({
      absPath: abs,
      arcName: `media/${a.id}${ext}`,
    });
  }

  const zipPath = await d.joinPath(
    exportDir,
    `project-${params.project.id}-${stamp}.zip`,
  );
  await d.exportZip(entries, zipPath);
  return { ok: true, zipPath };
}
