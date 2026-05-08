"use client";

import Link from "next/link";
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
import { useProviderRunLogStore } from "@/lib/providers/providerRunLog";

export function ProviderActivityBoard() {
  const entries = useProviderRunLogStore((s) => s.entries);

  const sorted = useMemo(
    () => [...entries].sort((a, b) => b.timestamp.localeCompare(a.timestamp)),
    [entries],
  );

  return (
    <div className="mx-auto max-w-6xl px-8 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
            Providers
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Provider activity
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Network destinations show hosts and routes only — never raw
            Authorization headers or vault secrets.
          </p>
        </div>
        <Button variant="outline" size="sm" asChild>
          <Link href="/providers">Adapter catalog</Link>
        </Button>
      </div>

      <Card className="mt-10 border-line bg-panel-elevated/75">
        <CardHeader>
          <CardTitle className="text-lg">Recent attempts</CardTitle>
          <CardDescription>
            Execution attempts across Generic HTTP, ComfyUI, and mock lanes.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {sorted.length === 0 && (
            <p className="text-sm text-ink-muted">No provider runs logged yet.</p>
          )}
          {sorted.map((e) => (
            <div
              key={e.id}
              className="rounded-xl border border-line bg-panel px-4 py-3 text-sm"
            >
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="muted">{e.timestamp}</Badge>
                <Badge variant="cyan">{e.providerId}</Badge>
                <Badge variant="lime">{e.lane}</Badge>
                <Badge>{e.status}</Badge>
                {e.httpStatus !== undefined && (
                  <Badge variant="muted">HTTP {e.httpStatus}</Badge>
                )}
              </div>
              <div className="mt-2 grid gap-1 font-mono text-[11px] text-ink-muted">
                <div>
                  <span className="text-ink-faint">method · </span>
                  {e.method}
                </div>
                {e.endpointHost && (
                  <div>
                    <span className="text-ink-faint">host · </span>
                    {e.endpointHost}
                  </div>
                )}
                {e.networkDestination && (
                  <div>
                    <span className="text-ink-faint">destination · </span>
                    {e.networkDestination}
                  </div>
                )}
                {e.jobId && (
                  <div>
                    <span className="text-ink-faint">job · </span>
                    <Link
                      className="text-accent-cyan hover:underline"
                      href={`/queue?highlight=${e.jobId}`}
                    >
                      {e.jobId}
                    </Link>
                  </div>
                )}
                {e.credentialRef && (
                  <div>
                    <span className="text-ink-faint">credentialRef · </span>
                    {e.credentialRef}
                  </div>
                )}
                {e.durationMs !== undefined && (
                  <div>
                    <span className="text-ink-faint">duration · </span>
                    {e.durationMs} ms
                  </div>
                )}
                {e.errorMessage && (
                  <div className="text-danger">{e.errorMessage}</div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
