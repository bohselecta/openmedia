"use client";

import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getProviderById } from "@/lib/providers/registry";
import { PROVIDER_CATALOG } from "@/lib/providers/uiCatalog";

export function ProvidersBoard() {
  const rows = useMemo(() => {
    return PROVIDER_CATALOG.map((entry) => {
      const adapter = getProviderById(entry.id);
      const connected = adapter?.kind === "mock";
      const configured =
        adapter !== undefined &&
        adapter.kind !== "mock" &&
        adapter.capabilities.length >= 0;
      const status = connected
        ? "Connected · demo lane"
        : adapter
          ? "Registry stub · not runnable"
          : "Architecture slot · planned";
      return { entry, adapter, status };
    });
  }, []);

  return (
    <div className="mx-auto max-w-6xl px-8 py-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
          Providers
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          Adapter architecture
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-muted">
          OpenMediaForge is provider-neutral: every engine is a manifest-driven
          adapter. Mock is truly wired; everything else stays visibly labeled
          until an integration is implemented — no fake hosted compute.
        </p>
      </div>
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        {rows.map(({ entry, adapter, status }) => (
          <Card key={entry.id} className="border-line bg-panel-elevated/75">
            <CardHeader className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <Badge variant="cyan">{entry.kind}</Badge>
                <Badge variant="muted">{entry.lane}</Badge>
              </div>
              <CardTitle className="text-xl">{entry.name}</CardTitle>
              <CardDescription className="space-y-2">
                <div>{status}</div>
                <div className="text-xs uppercase tracking-wide text-ink-faint">
                  Capabilities
                </div>
                <div className="font-normal text-sm text-ink-muted">
                  {entry.capabilities.join(" · ")}
                </div>
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="rounded-xl border border-line bg-panel px-4 py-3">
                <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                  Auth mode
                </div>
                <div className="mt-2 text-ink">{entry.authMode}</div>
              </div>
              <p className="text-xs leading-relaxed text-ink-muted">{entry.honesty}</p>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                disabled={entry.id !== "mock"}
              >
                {entry.id === "mock"
                  ? "Connected via registry"
                  : "Configure (soon)"}
              </Button>
              {adapter && (
                <p className="text-[11px] text-ink-faint">
                  Adapter id · <span className="font-mono">{adapter.id}</span>
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
