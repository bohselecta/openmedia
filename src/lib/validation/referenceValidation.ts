import type { AssetMapEntry } from "@/lib/assetMap/assetMapTypes";
import { isGenericAssetLabel } from "@/lib/assetMap/handles";
import type { Asset } from "@/lib/assets/assetTypes";
import type { ModelManifest } from "@/lib/models/manifestTypes";
import type { MediaTask, ReferenceSelection } from "@/lib/providers/types";

export type ReferenceValidationResult = {
  errors: string[];
  warnings: string[];
};

function normalizeHandle(h: string): string {
  const t = h.trim();
  if (!t) return "";
  return t.startsWith("@") ? t : `@${t}`;
}

function handlesConflict(a: string, b: string): boolean {
  return normalizeHandle(a).toLowerCase() === normalizeHandle(b).toLowerCase();
}

function primaryLike(sel: ReferenceSelection, asset?: Asset): boolean {
  const role = (asset?.role ?? sel.role).toLowerCase();
  return (
    role === "reference" ||
    role === "character" ||
    role === "product" ||
    sel.priority === "must_preserve"
  );
}

export function validateReferenceSelections(params: {
  projectId?: string;
  task: MediaTask;
  manifest?: ModelManifest;
  selections: ReferenceSelection[];
  assets: Asset[];
  mapEntries: AssetMapEntry[];
}): ReferenceValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const { projectId, task, manifest, selections, assets, mapEntries } = params;

  const maxRefs = manifest?.referenceBudget?.maxReferences ?? 8;
  const requiresPrimary =
    manifest?.referenceBudget?.requiresPrimaryReference ?? false;

  const handleSeen = new Set<string>();
  for (const sel of selections) {
    const key = normalizeHandle(sel.stableHandle).toLowerCase();
    if (!key) {
      errors.push("Each reference needs a stable handle.");
      continue;
    }
    if (handleSeen.has(key)) {
      errors.push(
        `Duplicate stable handle ${normalizeHandle(sel.stableHandle)}.`,
      );
    }
    handleSeen.add(key);

    const asset = assets.find((a) => a.id === sel.assetId);
    if (!asset) {
      errors.push(`Reference asset ${sel.assetId} was not found in the library.`);
      continue;
    }
    if (projectId && asset.projectId && asset.projectId !== projectId) {
      errors.push(
        `Asset ${asset.label} is not attached to this project — bind it first.`,
      );
    }

    if (isGenericAssetLabel(asset.label)) {
      warnings.push(`"${asset.label}" looks generic — consider a descriptive label.`);
    }

    if (asset.role && asset.role !== sel.role) {
      warnings.push(
        `Role mismatch for ${normalizeHandle(sel.stableHandle)}: map says "${asset.role}", selection uses "${sel.role}".`,
      );
    }

    if (asset.role === "output") {
      warnings.push(
        `${normalizeHandle(sel.stableHandle)} is tagged as output — unusual as a reference.`,
      );
    }
  }

  if (selections.length > maxRefs) {
    warnings.push(
      `Selection exceeds manifest reference budget (${selections.length} > ${maxRefs}).`,
    );
  }

  if (
    task === "image-to-image" &&
    requiresPrimary &&
    selections.length > 0 &&
    !selections.some((s) => {
      const asset = assets.find((a) => a.id === s.assetId);
      return primaryLike(s, asset);
    })
  ) {
    warnings.push(
      "Image-to-image mode expects a primary reference (reference / character / product role or must-preserve priority).",
    );
  }

  for (const sel of selections) {
    const entry = mapEntries.find((m) => m.assetId === sel.assetId);
    if (!entry && projectId) {
      warnings.push(
        `${normalizeHandle(sel.stableHandle)} has no Asset Map row for this project — continuity may drift.`,
      );
    }
  }

  return { errors, warnings };
}
