import type { AssetMapEntry } from "@/lib/assetMap/assetMapTypes";
import type { ReferenceSelection } from "@/lib/providers/types";

export function mapPriorityFromSelection(
  p: ReferenceSelection["priority"],
): AssetMapEntry["priority"] {
  if (p === "must_preserve") return "high";
  if (p === "guide_style") return "medium";
  return "low";
}

export function selectionPriorityFromMap(
  p: AssetMapEntry["priority"],
): ReferenceSelection["priority"] {
  if (p === "high") return "must_preserve";
  if (p === "medium") return "guide_style";
  return "optional_inspiration";
}
