"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAssetStore } from "@/lib/assets/assetStore";

export function AssetsBoard() {
  const assets = useAssetStore((s) => s.assets);
  const mapEntries = useAssetStore((s) => s.assetMap);

  const grouped = useMemo(() => {
    return [...assets].sort(
      (a, b) =>
        new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [assets]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-10 px-8 py-12 lg:flex-row">
      <div className="flex-1 space-y-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
            Library
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">Assets</h1>
          <p className="mt-3 max-w-2xl text-sm text-ink-muted">
            Every generation lands here with explicit roles and rights metadata.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          {grouped.length === 0 && (
            <Card className="border-dashed border-line bg-panel/60">
              <CardHeader>
                <CardTitle>No assets yet</CardTitle>
                <CardDescription>
                  Run the Mock Provider from Image Studio to seed your library.
                </CardDescription>
              </CardHeader>
            </Card>
          )}
          {grouped.map((asset) => (
            <Card key={asset.id} className="border-line bg-panel-elevated/70">
              <CardHeader className="space-y-3">
                <div className="relative aspect-video w-full overflow-hidden rounded-xl border border-line bg-black">
                  {asset.kind === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.uri}
                      alt={asset.label}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-ink-muted">
                      {asset.kind.toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {asset.role && <Badge variant="cyan">{asset.role}</Badge>}
                  <Badge variant="muted">{asset.rightsStatus}</Badge>
                </div>
                <CardTitle className="text-lg">{asset.label}</CardTitle>
                <CardDescription className="font-mono text-[11px]">
                  {asset.uri.slice(0, 48)}…
                </CardDescription>
              </CardHeader>
            </Card>
          ))}
        </div>
      </div>
      <aside className="w-full shrink-0 lg:w-[320px]">
        <Card className="border-line-strong bg-panel">
          <CardHeader>
            <CardTitle className="text-lg">Reference budget</CardTitle>
            <CardDescription>
              Stable labels and bracket tags for prompt attachments.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm text-ink-muted">
            <p>
              Map entries tie assets to projects with priority and inclusion
              policies — scaffolding for the reference wall described in the
              product spec.
            </p>
            <Separator />
            {mapEntries.length === 0 ? (
              <p>No mapped references yet.</p>
            ) : (
              <ul className="space-y-3">
                {mapEntries.map((e) => (
                  <li key={e.id} className="rounded-xl border border-line bg-panel-elevated p-3">
                    <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
                      {e.stableLabel}
                    </div>
                    <div className="mt-1 text-sm text-ink">{e.role}</div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </aside>
    </div>
  );
}
