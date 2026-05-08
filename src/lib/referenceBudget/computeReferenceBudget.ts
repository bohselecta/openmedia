import type { AssetMapEntry } from "@/lib/assetMap/assetMapTypes";
import type { Asset } from "@/lib/assets/assetTypes";
import type { ModelManifest } from "@/lib/models/manifestTypes";
import type { ReferenceSelection } from "@/lib/providers/types";
import type { ReferenceBudgetWarningKind } from "@/lib/referenceBudget/referenceBudgetTypes";
import { isGenericAssetLabel } from "@/lib/assetMap/handles";

export type ReferenceBudgetSnapshot = {
  maxReferences: number;
  selectedCount: number;
  requiresPrimaryReference: boolean;
  roleCounts: Record<string, number>;
  warnings: ReferenceBudgetWarningKind[];
};

function mapEntryPriorityToTier(
  p: AssetMapEntry["priority"],
): "must-preserve" | "guide-style" | "optional-inspiration" {
  if (p === "high") return "must-preserve";
  if (p === "medium") return "guide-style";
  return "optional-inspiration";
}

export function computeReferenceBudgetSnapshot(params: {
  manifest?: ModelManifest;
  selectedAssetIds: string[];
  assets: Asset[];
  referenceSelections?: ReferenceSelection[];
}): ReferenceBudgetSnapshot {
  const maxReferences =
    params.manifest?.referenceBudget?.maxReferences ?? 8;
  const requiresPrimaryReference =
    params.manifest?.referenceBudget?.requiresPrimaryReference ?? false;

  const selectedAssets = params.assets.filter((a) =>
    params.selectedAssetIds.includes(a.id),
  );

  const roleCounts: Record<string, number> = {};
  if (params.referenceSelections?.length) {
    for (const s of params.referenceSelections) {
      roleCounts[s.role] = (roleCounts[s.role] ?? 0) + 1;
    }
  } else {
    for (const a of selectedAssets) {
      const role = a.role ?? "reference";
      roleCounts[role] = (roleCounts[role] ?? 0) + 1;
    }
  }

  const warnings: ReferenceBudgetWarningKind[] = [];

  if (selectedAssets.length > maxReferences) {
    warnings.push("too-many-references");
  }

  const primaryLike =
    params.referenceSelections?.length ?
      params.referenceSelections.some(
        (s) =>
          s.priority === "must_preserve" ||
          s.role === "reference" ||
          s.role === "character" ||
          s.role === "product",
      )
    : selectedAssets.some(
        (a) =>
          a.role === "reference" ||
          a.role === "character" ||
          a.role === "product",
      );

  if (requiresPrimaryReference && selectedAssets.length > 0 && !primaryLike) {
    warnings.push("missing-primary-reference");
  }

  const unlabeled = selectedAssets.some((a) => isGenericAssetLabel(a.label));
  if (unlabeled) {
    warnings.push("unlabeled-references");
  }

  return {
    maxReferences,
    selectedCount: selectedAssets.length,
    requiresPrimaryReference,
    roleCounts,
    warnings,
  };
}

export function priorityTierCountsFromSelections(
  selections: ReferenceSelection[],
): Record<string, number> {
  const c: Record<string, number> = {};
  for (const s of selections) {
    c[s.priority] = (c[s.priority] ?? 0) + 1;
  }
  return c;
}

export { mapEntryPriorityToTier };
