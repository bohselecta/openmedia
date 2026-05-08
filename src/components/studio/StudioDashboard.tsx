"use client";

import Link from "next/link";
import { useMemo } from "react";
import {
  ArrowRight,
  Boxes,
  FolderKanban,
  ImageIcon,
  KeyRound,
  Receipt,
  Sparkles,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useAssetStore } from "@/lib/assets/assetStore";
import { useJobStore } from "@/lib/jobs/jobStore";
import { useProjectStore } from "@/lib/projects/projectStore";
import { useReceiptStore } from "@/lib/receipts/receiptStore";
import { useCredentialStore } from "@/lib/keyrail/credentialStore";
import { formatProjectKind } from "@/lib/projects/projectKindLabels";
import { loadProviderRegistry } from "@/lib/providers/registry";

export function StudioDashboard() {
  const projects = useProjectStore((s) => s.projects);
  const currentId = useProjectStore((s) => s.currentProjectId);
  const jobs = useJobStore((s) => s.jobs);
  const assets = useAssetStore((s) => s.assets);
  const receipts = useReceiptStore((s) => s.receipts);
  const credentials = useCredentialStore((s) => s.credentials);

  const activeProject = projects.find((p) => p.id === currentId);
  const registry = useMemo(() => loadProviderRegistry(), []);

  const recentJobs = useMemo(
    () =>
      [...jobs]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        .slice(0, 6),
    [jobs],
  );

  const recentAssets = useMemo(
    () =>
      [...assets]
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        )
        .slice(0, 8),
    [assets],
  );

  const sessionJobsToday = useMemo(() => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    return jobs.filter((j) => new Date(j.createdAt) >= start).length;
  }, [jobs]);

  const mockConnected = registry.some((p) => p.id === "mock");
  const localConfigured = registry.filter(
    (p) => p.kind === "local" && p.id !== "mock",
  ).length;
  const byokConfigured = credentials.filter((c) => c.providerId !== "mock")
    .length;

  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ink-faint">
            Command desk
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Studio session
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Projects anchor everything — assets, jobs, receipts, and KeyRail refs
            travel together. Mock compute is the safe demo lane until adapters
            land.
          </p>
        </div>
        <Button variant="accent" asChild>
          <Link href="/studio/image">
            New image job
            <Sparkles className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-line-strong bg-panel-elevated/80 shadow-glow backdrop-blur">
          <CardHeader className="space-y-2">
            <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-faint">
              <FolderKanban className="h-4 w-4 text-accent-cyan" />
              Active project
            </div>
            <CardTitle className="text-2xl">
              {activeProject?.title ?? "No project selected"}
            </CardTitle>
            <CardDescription className="text-ink-muted">
              {activeProject
                ? `Kind · ${formatProjectKind(activeProject.projectKind)} · updated ${new Date(activeProject.updatedAt).toLocaleString()}`
                : "Pick or create a project from the top bar."}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="outline" size="sm" asChild>
              <Link href="/projects">Manage projects</Link>
            </Button>
            {activeProject && (
              <Button variant="ghost" size="sm" asChild>
                <Link href={`/projects/${activeProject.id}`}>Open workspace</Link>
              </Button>
            )}
          </CardContent>
        </Card>

        <Card className="border-line bg-panel/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Zap className="h-5 w-5 text-accent-lime" />
              Today&apos;s session
            </CardTitle>
            <CardDescription>
              Jobs started today · local ledger only.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-baseline justify-between gap-4">
              <span className="text-4xl font-semibold tabular-nums">
                {sessionJobsToday}
              </span>
              <span className="text-xs uppercase tracking-wide text-ink-faint">
                submissions
              </span>
            </div>
            <Separator className="bg-line" />
            <div className="grid gap-2 text-sm text-ink-muted">
              <div className="flex justify-between">
                <span>Receipts minted</span>
                <span className="tabular-nums text-ink">{receipts.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Assets indexed</span>
                <span className="tabular-nums text-ink">{assets.length}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-5 xl:grid-cols-3">
        <Card className="border-line bg-panel-elevated/70 xl:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent jobs</CardTitle>
              <CardDescription>Queue snapshots · newest first.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/queue">Full queue</Link>
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentJobs.length === 0 && (
              <p className="text-sm text-ink-muted">
                Submit from Image Studio — jobs render here instantly.
              </p>
            )}
            {recentJobs.map((j) => (
              <Link
                key={j.id}
                href={`/queue`}
                className="flex items-center justify-between rounded-xl border border-line bg-panel px-4 py-3 transition-colors hover:border-line-strong"
              >
                <div>
                  <div className="text-sm font-medium">{j.task}</div>
                  <div className="mt-1 text-xs text-ink-muted line-clamp-1">
                    {j.prompt}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Badge variant="cyan">{j.providerId}</Badge>
                  <span className="text-[11px] uppercase tracking-wide text-ink-faint">
                    {j.status}
                  </span>
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="border-line bg-panel-elevated/70">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Boxes className="h-5 w-5 text-accent-cyan" />
              Provider status
            </CardTitle>
            <CardDescription>Honest connectivity snapshot.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="rounded-xl border border-line bg-panel px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Mock lane</span>
                <Badge variant="lime">{mockConnected ? "Active" : "Missing"}</Badge>
              </div>
              <p className="mt-2 text-xs text-ink-faint">
                Deterministic demo engine — no keys required.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-panel px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">Local adapters</span>
                <Badge variant="muted">{localConfigured} placeholders</Badge>
              </div>
              <p className="mt-2 text-xs text-ink-faint">
                Comfy / sd.cpp / WAN shells visible — configure later.
              </p>
            </div>
            <div className="rounded-xl border border-line bg-panel px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="text-ink-muted">BYOK via KeyRail</span>
                <Badge variant="muted">{byokConfigured} creds</Badge>
              </div>
              <p className="mt-2 text-xs text-ink-faint">
                Execution tickets map refs — raw secrets never touch receipts.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-5 lg:grid-cols-2">
        <Card className="border-line bg-panel-elevated/70">
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <div>
              <CardTitle>Recent assets</CardTitle>
              <CardDescription>Latest writes across projects.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" asChild>
              <Link href="/assets">Library</Link>
            </Button>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {recentAssets.length === 0 && (
              <p className="text-sm text-ink-muted sm:col-span-2">
                Completed mock jobs drop labeled placeholders here.
              </p>
            )}
            {recentAssets.map((a) => (
              <div
                key={a.id}
                className="overflow-hidden rounded-xl border border-line bg-panel"
              >
                <div className="relative aspect-video w-full bg-black">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.uri}
                    alt={a.label}
                    className="h-full w-full object-cover opacity-90"
                  />
                </div>
                <div className="space-y-1 p-3">
                  <div className="text-xs font-semibold">{a.label}</div>
                  <div className="text-[11px] uppercase tracking-wide text-ink-faint">
                    {a.role ?? "unassigned"}
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-line-strong bg-panel/90">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <KeyRound className="h-5 w-5 text-accent-lime" />
              KeyRail status
            </CardTitle>
            <CardDescription>
              Trusted access layer · refs only on jobs and receipts.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-xs leading-relaxed text-warning">
              Browser-dev vault is labeled temporary — desktop keychain and
              server vault arrive later.
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge variant="cyan">{credentials.length} credential refs</Badge>
              <Badge variant="muted">Audit trail local</Badge>
            </div>
            <Button variant="outline" size="sm" className="w-full" asChild>
              <Link href="/keys">Open KeyRail console</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <QuickAction
          title="New image job"
          desc="Mock lane · receipts"
          href="/studio/image"
          icon={ImageIcon}
        />
        <QuickAction
          title="New video plan"
          desc="Honest roadmap tile"
          href="/studio/video"
          icon={Sparkles}
        />
        <QuickAction
          title="Import assets"
          desc="Library · roles"
          href="/assets"
          icon={FolderKanban}
        />
        <QuickAction
          title="Open receipts"
          desc="Production ledger"
          href="/receipts"
          icon={Receipt}
        />
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <Card className="border-line bg-panel-elevated/70">
          <CardHeader>
            <CardTitle>Compute mode</CardTitle>
            <CardDescription>What is live vs planned.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <ModeRow label="Mock provider" value="Active · demo lane" ok />
            <ModeRow
              label="Local providers"
              value={localConfigured ? `${localConfigured} placeholders visible` : "Not configured"}
              ok={false}
            />
            <ModeRow
              label="BYOK providers"
              value={
                byokConfigured
                  ? `${byokConfigured} credential ref(s)`
                  : "Not configured"
              }
              ok={byokConfigured > 0}
            />
          </CardContent>
        </Card>

        <Card className="border-line bg-panel-elevated/70">
          <CardHeader>
            <CardTitle>Receipt hygiene</CardTitle>
            <CardDescription>
              Every generation should mint proof — chase stragglers in the
              ledger.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3">
            <Button variant="accent" asChild>
              <Link href="/receipts">
                Browse receipts
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/providers">Provider architecture</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function QuickAction({
  title,
  desc,
  href,
  icon: Icon,
}: {
  title: string;
  desc: string;
  href: string;
  icon: typeof Sparkles;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-line bg-panel-elevated/70 p-5 transition-all hover:border-line-strong hover:shadow-glow"
    >
      <Icon className="h-5 w-5 text-accent-cyan" />
      <div className="mt-4 text-sm font-semibold">{title}</div>
      <div className="mt-1 text-xs text-ink-muted">{desc}</div>
    </Link>
  );
}

function ModeRow({
  label,
  value,
  ok,
}: {
  label: string;
  value: string;
  ok: boolean;
}) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-line bg-panel px-4 py-3">
      <span className="text-ink-muted">{label}</span>
      <Badge variant={ok ? "lime" : "muted"}>{value}</Badge>
    </div>
  );
}
