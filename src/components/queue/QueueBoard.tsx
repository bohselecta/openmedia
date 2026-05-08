"use client";

import Link from "next/link";
import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useJobStore } from "@/lib/jobs/jobStore";
import { useProjectStore } from "@/lib/projects/projectStore";
import { loadProviderRegistry } from "@/lib/providers/registry";
import type { ProviderKind } from "@/lib/providers/types";

function laneLabel(kind: ProviderKind): { label: string; variant: "lime" | "cyan" | "amber" | "muted" } {
  if (kind === "mock") return { label: "Mock lane", variant: "lime" };
  if (kind === "local") return { label: "Local lane", variant: "cyan" };
  if (kind === "remote") return { label: "BYOK remote lane", variant: "amber" };
  return { label: "Future hosted lane", variant: "muted" };
}

export function QueueBoard() {
  const jobs = useJobStore((s) => s.jobs);
  const projects = useProjectStore((s) => s.projects);
  const registry = useMemo(() => loadProviderRegistry(), []);

  const sorted = useMemo(
    () =>
      [...jobs].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [jobs],
  );

  function projectTitle(id?: string) {
    if (!id) return "—";
    return projects.find((p) => p.id === id)?.title ?? id.slice(0, 8);
  }

  return (
    <div className="mx-auto max-w-6xl px-8 py-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
          Queue
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          Render queue
        </h1>
        <p className="mt-4 max-w-2xl text-sm text-ink-muted">
          Operator-grade ledger — status, provider identity, models, spend
          estimates, and provenance links surface together.
        </p>
      </div>
      <div className="mt-12 space-y-4">
        {sorted.length === 0 && (
          <Card className="border-dashed border-line bg-panel/70">
            <CardHeader>
              <CardTitle>Queue is quiet</CardTitle>
              <CardDescription>
                Submit from Image Studio — entries appear instantly with mock
                badges.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
        {sorted.map((job) => {
          const provider = registry.find((p) => p.id === job.providerId);
          const lane = laneLabel(provider?.kind ?? "remote");
          return (
            <Card key={job.id} className="border-line bg-panel-elevated/75">
              <CardHeader className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="cyan">{job.providerId}</Badge>
                  <Badge variant="lime">{job.modelId}</Badge>
                  <Badge>{job.status}</Badge>
                  <Badge variant={lane.variant}>{lane.label}</Badge>
                  <Badge variant="muted">{job.task}</Badge>
                </div>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl">{job.task}</CardTitle>
                    <CardDescription className="mt-2 line-clamp-2">
                      {job.prompt}
                    </CardDescription>
                  </div>
                  <div className="text-right text-xs text-ink-muted">
                    <div className="font-mono text-[11px] text-ink-faint">
                      {job.id}
                    </div>
                    <div className="mt-1">
                      {new Date(job.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-5">
                <Progress value={job.progress} />
                <div className="grid gap-4 text-sm md:grid-cols-2 lg:grid-cols-3">
                  <Meta label="Project" value={projectTitle(job.projectId)} />
                  <Meta
                    label="Cost estimate"
                    value={
                      job.estimatedCost !== undefined
                        ? `$${job.estimatedCost.toFixed(4)}`
                        : "—"
                    }
                  />
                  <Meta
                    label="Credential ref"
                    value={job.credentialRef ?? "—"}
                  />
                  <Meta label="Provider job" value={String(job.settings?.executionTicketId ?? "local-run")} />
                </div>
                {job.error && (
                  <p className="text-sm text-danger">{job.error}</p>
                )}
                {(job.referenceSelections?.length ?? 0) > 0 && (
                  <div className="rounded-xl border border-line bg-panel px-3 py-2 text-xs text-ink-muted">
                    <span className="font-semibold text-ink-faint">
                      Reference selections ·{" "}
                    </span>
                    {job.referenceSelections
                      ?.map((r) => `${r.stableHandle} (${r.role} · ${r.priority})`)
                      .join(" · ")}
                  </div>
                )}
                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/receipts?jobId=${job.id}`}
                    className="text-xs font-semibold uppercase tracking-wide text-accent-cyan hover:text-ink"
                  >
                    Open receipt
                  </Link>
                  {job.outputAssetIds[0] && (
                    <Link
                      href="/assets"
                      className="text-xs font-semibold uppercase tracking-wide text-ink-muted hover:text-ink"
                    >
                      Output asset · {job.outputAssetIds[0].slice(0, 8)}…
                    </Link>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel px-3 py-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </div>
      <div className="mt-1 text-xs text-ink">{value}</div>
    </div>
  );
}
