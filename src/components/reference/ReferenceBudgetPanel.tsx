"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import type { AssetMapEntry } from "@/lib/assetMap/assetMapTypes";
import type { Asset } from "@/lib/assets/assetTypes";
import type { ModelManifest } from "@/lib/models/manifestTypes";
import type { ReferenceSelection } from "@/lib/providers/types";
import {
  computeReferenceBudgetSnapshot,
  mapEntryPriorityToTier,
  priorityTierCountsFromSelections,
} from "@/lib/referenceBudget/computeReferenceBudget";

const WARNING_LABEL: Record<string, string> = {
  "too-many-references": "Too many references vs manifest budget",
  "missing-primary-reference": "Primary reference not flagged",
  "unlabeled-references": "Some references need descriptive labels",
};

const TIER_LABEL: Record<string, string> = {
  must_preserve: "Must preserve",
  guide_style: "Guide style",
  optional_inspiration: "Optional inspiration",
};

const UI_TIER_LABEL: Record<string, string> = {
  "must-preserve": "Must preserve",
  "guide-style": "Guide style",
  "optional-inspiration": "Optional inspiration",
};

export function ReferenceBudgetPanel({
  manifest,
  referenceSelections,
  assets,
  mapEntries,
  compact,
  validationErrors = [],
  validationWarnings = [],
}: {
  manifest?: ModelManifest;
  referenceSelections: ReferenceSelection[];
  assets: Asset[];
  mapEntries: AssetMapEntry[];
  compact?: boolean;
  validationErrors?: string[];
  validationWarnings?: string[];
}) {
  const selectedAssetIds = useMemo(
    () => referenceSelections.map((s) => s.assetId),
    [referenceSelections],
  );

  const snap = useMemo(
    () =>
      computeReferenceBudgetSnapshot({
        manifest,
        selectedAssetIds,
        assets,
        referenceSelections,
      }),
    [manifest, selectedAssetIds, assets, referenceSelections],
  );

  const priorityCounts = useMemo(
    () => priorityTierCountsFromSelections(referenceSelections),
    [referenceSelections],
  );

  const tiers = useMemo(() => {
    const rows: { handle: string; tier: string }[] = [];
    for (const sel of referenceSelections) {
      rows.push({
        handle: sel.stableHandle,
        tier: TIER_LABEL[sel.priority] ?? sel.priority,
      });
    }
    return rows;
  }, [referenceSelections]);

  const legacyTiers = useMemo(() => {
    const rows: { handle: string; tier: string }[] = [];
    for (const id of selectedAssetIds) {
      const asset = assets.find((a) => a.id === id);
      const entry = mapEntries.find((m) => m.assetId === id);
      if (!asset) continue;
      const tier = entry
        ? mapEntryPriorityToTier(entry.priority)
        : "guide-style";
      rows.push({
        handle: entry?.stableLabel ?? asset.label,
        tier: UI_TIER_LABEL[tier] ?? tier,
      });
    }
    return rows;
  }, [selectedAssetIds, assets, mapEntries]);

  const visual =
    validationErrors.length > 0 ? "blocked" :
      validationWarnings.length > 0 || snap.warnings.length > 0 ? "warning"
    : "ready";

  const ring =
    visual === "blocked" ? "border-danger/50 bg-danger/5"
    : visual === "warning" ? "border-warning/45 bg-warning/5"
    : "border-line bg-panel-elevated/80";

  return (
    <div
      className={`rounded-2xl border ${ring} ${compact ? "p-4" : "p-5"}`}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-faint">
          Reference budget
        </div>
        <Badge
          variant={
            visual === "ready" ? "lime"
            : visual === "warning" ? "muted"
            : "amber"
          }
        >
          {visual === "ready" ? "Ready"
          : visual === "warning" ? "Warnings"
          : "Blocked"}
        </Badge>
      </div>
      <div className="mt-4 grid gap-3 text-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-ink-muted">Manifest cap</span>
          <Badge variant="cyan">{snap.maxReferences} refs</Badge>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-ink-muted">Selected</span>
          <Badge variant="muted">
            {snap.selectedCount} / {snap.maxReferences}
          </Badge>
        </div>
        {!compact && (
          <div className="rounded-xl border border-line bg-panel px-3 py-2 text-xs text-ink-muted">
            <div className="font-semibold uppercase tracking-wide text-ink-faint">
              Roles in selection
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.keys(snap.roleCounts).length === 0 && (
                <span>No references picked yet.</span>
              )}
              {Object.entries(snap.roleCounts).map(([role, n]) => (
                <Badge key={role} variant="muted">
                  {role}: {n}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {!compact && Object.keys(priorityCounts).length > 0 && (
          <div className="rounded-xl border border-line bg-panel px-3 py-2 text-xs text-ink-muted">
            <div className="font-semibold uppercase tracking-wide text-ink-faint">
              Priority tiers
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              {Object.entries(priorityCounts).map(([p, n]) => (
                <Badge key={p} variant="muted">
                  {TIER_LABEL[p] ?? p}: {n}
                </Badge>
              ))}
            </div>
          </div>
        )}
        {!compact && tiers.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Handles × priority
            </div>
            <div className="space-y-2">
              {tiers.map((t) => (
                <div
                  key={`${t.handle}-${t.tier}`}
                  className="flex items-center justify-between rounded-lg border border-line bg-panel px-3 py-2 text-xs"
                >
                  <span className="font-mono text-accent-cyan">{t.handle}</span>
                  <span className="text-ink-muted">{t.tier}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {!compact && referenceSelections.length === 0 && legacyTiers.length > 0 && (
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
              Priority (map-derived)
            </div>
            <div className="space-y-2">
              {legacyTiers.map((t) => (
                <div
                  key={`${t.handle}-legacy`}
                  className="flex items-center justify-between rounded-lg border border-line bg-panel px-3 py-2 text-xs"
                >
                  <span className="font-mono text-accent-cyan">{t.handle}</span>
                  <span className="text-ink-muted">{t.tier}</span>
                </div>
              ))}
            </div>
          </div>
        )}
        {snap.warnings.length > 0 && (
          <div className="space-y-2 rounded-xl border border-warning/40 bg-warning/10 px-3 py-3 text-xs text-warning">
            {snap.warnings.map((w) => (
              <div key={w}>{WARNING_LABEL[w] ?? w}</div>
            ))}
          </div>
        )}
        {validationWarnings.length > 0 && (
          <div className="space-y-2 rounded-xl border border-warning/35 bg-warning/10 px-3 py-3 text-xs text-warning">
            {validationWarnings.map((w) => (
              <div key={w}>{w}</div>
            ))}
          </div>
        )}
        {validationErrors.length > 0 && (
          <div className="space-y-2 rounded-xl border border-danger/45 bg-danger/10 px-3 py-3 text-xs text-danger">
            {validationErrors.map((e) => (
              <div key={e}>{e}</div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
