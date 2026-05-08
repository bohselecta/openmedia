"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { AssetMapEntry, AssetRole } from "@/lib/assetMap/assetMapTypes";
import { ASSET_ROLE_OPTIONS } from "@/lib/assetMap/assetRoles";
import {
  isGenericAssetLabel,
  suggestedStableHandle,
} from "@/lib/assetMap/handles";
import {
  mapPriorityFromSelection,
  selectionPriorityFromMap,
} from "@/lib/reference/referencePriorityBridge";
import type { ReferenceSelection } from "@/lib/providers/types";
import type { Asset } from "@/lib/assets/assetTypes";
import { useAssetStore } from "@/lib/assets/assetStore";

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `map-${Date.now()}`;
}

export function AssetMapPanel({
  projectId,
  referenceUsageByAssetId,
}: {
  projectId: string;
  referenceUsageByAssetId?: Record<string, number>;
}) {
  const assets = useAssetStore((s) => s.assets);
  const assetMap = useAssetStore((s) => s.assetMap);
  const upsertAsset = useAssetStore((s) => s.upsertAsset);
  const upsertMapEntry = useAssetStore((s) => s.upsertMapEntry);

  const projectAssets = useMemo(
    () => assets.filter((a) => a.projectId === projectId),
    [assets, projectId],
  );

  const grouped = useMemo(() => {
    const buckets: Record<string, Asset[]> = {};
    for (const a of projectAssets) {
      const role = a.role ?? "reference";
      if (!buckets[role]) buckets[role] = [];
      buckets[role].push(a);
    }
    return buckets;
  }, [projectAssets]);

  function entryFor(assetId: string): AssetMapEntry | undefined {
    return assetMap.find(
      (e) => e.assetId === assetId && e.projectId === projectId,
    );
  }

  function ensureEntry(asset: Asset): AssetMapEntry {
    const existing = entryFor(asset.id);
    if (existing) return existing;
    const handle = suggestedStableHandle(asset.label);
    const fresh: AssetMapEntry = {
      id: newId(),
      assetId: asset.id,
      projectId,
      stableLabel: handle,
      bracketLabel: `[${handle.slice(1)}]`,
      role: asset.role ?? "reference",
      priority: "medium",
      includePolicy: "manual-only",
      rightsStatus: asset.rightsStatus,
    };
    upsertMapEntry(fresh);
    return fresh;
  }

  function onRoleChange(asset: Asset, role: AssetRole) {
    const next = { ...asset, role, updatedAt: new Date().toISOString() };
    upsertAsset(next);
    const entry = ensureEntry(next);
    upsertMapEntry({
      ...entry,
      role,
    });
  }

  function onLabelChange(asset: Asset, label: string) {
    const next = { ...asset, label, updatedAt: new Date().toISOString() };
    upsertAsset(next);
    const entry = ensureEntry(next);
    const handle = suggestedStableHandle(label);
    upsertMapEntry({
      ...entry,
      stableLabel: handle,
      bracketLabel: `[${handle.slice(1)}]`,
    });
  }

  function onStudioPriority(
    asset: Asset,
    priority: ReferenceSelection["priority"],
  ) {
    const entry = ensureEntry(asset);
    upsertMapEntry({
      ...entry,
      priority: mapPriorityFromSelection(priority),
    });
  }

  return (
    <div className="space-y-8">
      {projectAssets.length === 0 && (
        <p className="text-sm text-ink-muted">
          No assets attached yet — run an Image Studio job or bind uploads to this
          project from Assets.
        </p>
      )}
      {Object.entries(grouped).map(([role, items]) => (
        <section key={role} className="space-y-4">
          <div className="flex items-center gap-3">
            <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-ink-faint">
              {role}
            </h3>
            <Badge variant="muted">{items.length}</Badge>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {items.map((asset) => {
              const entry = ensureEntry(asset);
              const handle =
                entry?.stableLabel ?? suggestedStableHandle(asset.label);
              const warn = isGenericAssetLabel(asset.label);
              const usage = referenceUsageByAssetId?.[asset.id];
              return (
                <div
                  key={asset.id}
                  className="rounded-2xl border border-line bg-panel-elevated/80 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <div className="font-mono text-sm text-accent-cyan">
                        {handle}
                      </div>
                      {warn && (
                        <p className="mt-2 text-xs text-warning">
                          Label feels generic — rename for stable continuity.
                        </p>
                      )}
                    </div>
                    <Badge variant="cyan">{asset.kind}</Badge>
                  </div>
                  <div className="mt-4 grid gap-3">
                    <div className="grid gap-2">
                      <Label className="text-xs uppercase tracking-wide text-ink-faint">
                        Label
                      </Label>
                      <Input
                        value={asset.label}
                        onChange={(e) => onLabelChange(asset, e.target.value)}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs uppercase tracking-wide text-ink-faint">
                        Role
                      </Label>
                      <Select
                        value={(asset.role ?? "reference") as AssetRole}
                        onValueChange={(v) => onRoleChange(asset, v as AssetRole)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ASSET_ROLE_OPTIONS.map((r) => (
                            <SelectItem key={r} value={r}>
                              {r}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-xs uppercase tracking-wide text-ink-faint">
                        Reference tier
                      </Label>
                      <Select
                        value={selectionPriorityFromMap(entry.priority)}
                        onValueChange={(v) =>
                          onStudioPriority(
                            asset,
                            v as ReferenceSelection["priority"],
                          )
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="must_preserve">
                            Must preserve
                          </SelectItem>
                          <SelectItem value="guide_style">
                            Guide style
                          </SelectItem>
                          <SelectItem value="optional_inspiration">
                            Optional inspiration
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/studio/image?pickAsset=${asset.id}`}>
                          Use as reference
                        </Link>
                      </Button>
                    </div>
                    {usage !== undefined && usage > 0 && (
                      <p className="text-[11px] text-ink-muted">
                        Linked in {usage} job{usage === 1 ? "" : "s"} as an input
                        reference.
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
