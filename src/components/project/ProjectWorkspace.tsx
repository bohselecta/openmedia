"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  ArrowRight,
  Boxes,
  Clapperboard,
  Download,
  Layers,
  Sparkles,
} from "lucide-react";
import { AssetMapPanel } from "@/components/project/AssetMapPanel";
import { ReferenceBudgetPanel } from "@/components/reference/ReferenceBudgetPanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { suggestedStableHandle } from "@/lib/assetMap/handles";
import { selectionPriorityFromMap } from "@/lib/reference/referencePriorityBridge";
import { useAssetStore } from "@/lib/assets/assetStore";
import {
  buildProjectPacket,
  projectPacketToJson,
} from "@/lib/export/projectPacket";
import { useJobStore } from "@/lib/jobs/jobStore";
import { useCredentialStore } from "@/lib/keyrail/credentialStore";
import { getManifestById } from "@/lib/models/sampleManifests";
import type { ReferenceSelection } from "@/lib/providers/types";
import { formatProjectKind } from "@/lib/projects/projectKindLabels";
import type { Project } from "@/lib/projects/projectTypes";
import { computeProjectStats } from "@/lib/projects/projectStats";
import { useReceiptStore } from "@/lib/receipts/receiptStore";
import { validateReferenceSelections } from "@/lib/validation/referenceValidation";
import { useWorkspaceStore } from "@/lib/workspace/workspaceStore";

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `prompt-${Date.now()}`;
}

export function ProjectWorkspace({ project }: { project: Project }) {
  const assets = useAssetStore((s) => s.assets);
  const assetMap = useAssetStore((s) => s.assetMap);
  const credentials = useCredentialStore((s) => s.credentials);
  const jobs = useJobStore((s) => s.jobs);
  const receipts = useReceiptStore((s) => s.receipts);
  const shots = useWorkspaceStore(
    (s) => s.storyboardByProject[project.id] ?? [],
  );
  const prompts = useWorkspaceStore(
    (s) => s.promptsByProject[project.id] ?? [],
  );
  const upsertPrompt = useWorkspaceStore((s) => s.upsertPrompt);

  const [promptTitle, setPromptTitle] = useState("");
  const [promptBody, setPromptBody] = useState("");
  const [promptHandles, setPromptHandles] = useState("");

  const stats = useMemo(
    () => computeProjectStats(project.id, assets, jobs, receipts),
    [project.id, assets, jobs, receipts],
  );

  const projectJobs = useMemo(
    () =>
      jobs
        .filter((j) => j.projectId === project.id)
        .sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
        ),
    [jobs, project.id],
  );

  const projectReceipts = useMemo(
    () =>
      receipts
        .filter((r) => r.projectId === project.id)
        .sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        ),
    [receipts, project.id],
  );

  const manifest = getManifestById("mock-image-v1");
  const mapForProject = useMemo(
    () => assetMap.filter((e) => e.projectId === project.id),
    [assetMap, project.id],
  );

  const refAssets = useMemo(
    () =>
      assets.filter(
        (a) =>
          a.projectId === project.id &&
          a.kind === "image" &&
          a.role !== "output",
      ),
    [assets, project.id],
  );

  const poolSelections: ReferenceSelection[] = useMemo(
    () =>
      refAssets.map((a) => {
        const e = mapForProject.find((m) => m.assetId === a.id);
        const handle = e?.stableLabel ?? suggestedStableHandle(a.label);
        return {
          assetId: a.id,
          stableHandle: handle.startsWith("@") ? handle : `@${handle}`,
          role: String(a.role ?? "reference"),
          priority: selectionPriorityFromMap(e?.priority ?? "medium"),
        };
      }),
    [refAssets, mapForProject],
  );

  const poolReferenceValidation = useMemo(
    () =>
      validateReferenceSelections({
        projectId: project.id,
        task: "text-to-image",
        manifest,
        selections: poolSelections,
        assets,
        mapEntries: mapForProject,
      }),
    [project.id, manifest, poolSelections, assets, mapForProject],
  );

  const refLinkedJobs = useMemo(
    () => projectJobs.filter((j) => (j.referenceSelections?.length ?? 0) > 0),
    [projectJobs],
  );

  const assetReferenceUsage = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const j of projectJobs) {
      for (const sel of j.referenceSelections ?? []) {
        counts[sel.assetId] = (counts[sel.assetId] ?? 0) + 1;
      }
    }
    return counts;
  }, [projectJobs]);

  function savePrompt() {
    if (!promptBody.trim()) return;
    const handles = promptHandles
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    upsertPrompt(project.id, {
      id: newId(),
      title: promptTitle.trim() || "Prompt note",
      body: promptBody.trim(),
      linkedHandles: handles.length ? handles : undefined,
      createdAt: new Date().toISOString(),
    });
    setPromptTitle("");
    setPromptBody("");
    setPromptHandles("");
  }

  function exportProjectPacket() {
    const packet = buildProjectPacket({
      project,
      assets,
      assetMap,
      jobs,
      receipts,
      shots,
      prompts,
      credentials,
    });
    const blob = new Blob([projectPacketToJson(packet)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `openmediaforge-project-${project.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-7xl px-8 py-10">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-ink-faint">
            Project workspace
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight">
            {project.title}
          </h1>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge variant="muted">{formatProjectKind(project.projectKind)}</Badge>
            <Badge variant="cyan">{stats.assetCount} assets</Badge>
            <Badge variant="lime">{stats.jobCount} jobs</Badge>
            <Badge variant="muted">{stats.receiptCount} receipts</Badge>
          </div>
          <p className="mt-4 max-w-2xl text-sm text-ink-muted">
            {project.description || "Drop a creative brief here — describe intent, palette, and continuity tokens."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="accent" asChild>
            <Link href="/studio/image">
              Launch image job
              <Sparkles className="ml-2 h-4 w-4" />
            </Link>
          </Button>
          <Button variant="outline" onClick={exportProjectPacket}>
            <Download className="mr-2 h-4 w-4" />
            Export project packet
          </Button>
          <Button variant="outline" asChild>
            <Link href="/studio/video">Video plan</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/queue">Queue</Link>
          </Button>
        </div>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-[1fr_320px]">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="flex w-full flex-wrap gap-1">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="asset-map">Asset map</TabsTrigger>
            <TabsTrigger value="jobs">Jobs</TabsTrigger>
            <TabsTrigger value="receipts">Receipts</TabsTrigger>
            <TabsTrigger value="prompts">Prompts</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-5 md:grid-cols-2">
              <Card className="border-line bg-panel/80">
                <CardHeader>
                  <CardTitle className="text-lg">Reference readiness</CardTitle>
                  <CardDescription>
                    Static scan of every non-output image in this project versus
                    mock text-to-image budgets.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-sm text-ink-muted">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="cyan">{refAssets.length} pool assets</Badge>
                    <Badge variant="lime">{refLinkedJobs.length} ref-linked jobs</Badge>
                  </div>
                  {poolReferenceValidation.errors.length > 0 && (
                    <div className="rounded-xl border border-danger/40 bg-danger/10 px-3 py-2 text-xs text-danger">
                      {poolReferenceValidation.errors.map((e) => (
                        <div key={e}>{e}</div>
                      ))}
                    </div>
                  )}
                  {poolReferenceValidation.warnings.length > 0 && (
                    <div className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning">
                      {poolReferenceValidation.warnings.map((w) => (
                        <div key={w}>{w}</div>
                      ))}
                    </div>
                  )}
                  {poolReferenceValidation.errors.length === 0 &&
                    poolReferenceValidation.warnings.length === 0 && (
                      <p className="text-xs">
                        No blocking reference issues detected on the static pass.
                      </p>
                    )}
                </CardContent>
              </Card>
              <Card className="border-dashed border-line bg-panel/70">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clapperboard className="h-5 w-5 text-accent-cyan" />
                    Storyboard lane
                  </CardTitle>
                  <CardDescription>
                    Shot planning happens in Storyboard — synced shots preview
                    below when added.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {shots.length === 0 && (
                    <p className="text-sm text-ink-muted">
                      No shots stored for this project yet.
                    </p>
                  )}
                  {shots.slice(0, 3).map((s) => (
                    <div
                      key={s.id}
                      className="rounded-xl border border-line bg-panel px-3 py-2 text-xs"
                    >
                      <div className="font-semibold">{s.title}</div>
                      <div className="text-ink-muted">{s.durationSec}s · {s.targetTask}</div>
                    </div>
                  ))}
                  <Button variant="outline" size="sm" asChild>
                    <Link href="/studio/storyboard">Open storyboard</Link>
                  </Button>
                </CardContent>
              </Card>
            </div>

            <Card className="border-line bg-panel-elevated/80">
              <CardHeader>
                <CardTitle>Provider usage</CardTitle>
                <CardDescription>
                  Providers touched by jobs in this project.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-2">
                {stats.providerIds.length === 0 && (
                  <span className="text-sm text-ink-muted">No jobs yet.</span>
                )}
                {stats.providerIds.map((id) => (
                  <Badge key={id} variant="cyan">
                    {id}
                  </Badge>
                ))}
              </CardContent>
            </Card>

            <Card className="border-line bg-panel">
              <CardHeader>
                <CardTitle className="text-base">Recent reference-linked jobs</CardTitle>
                <CardDescription>
                  Latest runs that recorded structured reference selections.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3 text-sm text-ink-muted">
                {refLinkedJobs.length === 0 && <p>No reference-linked jobs yet.</p>}
                {refLinkedJobs.slice(0, 5).map((j) => (
                  <div
                    key={j.id}
                    className="rounded-xl border border-line bg-panel-elevated/60 px-3 py-2"
                  >
                    <div className="font-mono text-[11px] text-ink-faint">{j.id}</div>
                    <div className="mt-1 text-xs">
                      {(j.referenceSelections ?? [])
                        .map((r) => r.stableHandle)
                        .join(" · ") || "—"}
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            <div className="grid gap-5 lg:grid-cols-2">
              <Card className="border-line bg-panel">
                <CardHeader>
                  <CardTitle className="text-base">Quick launch</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/studio/image">Image</Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/studio/workflows">Workflows</Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/assets">Assets</Link>
                  </Button>
                  <Button size="sm" variant="outline" asChild>
                    <Link href="/receipts">Receipts</Link>
                  </Button>
                </CardContent>
              </Card>
              <ReferenceBudgetPanel
                manifest={manifest}
                referenceSelections={poolSelections}
                assets={assets}
                mapEntries={mapForProject}
                validationErrors={poolReferenceValidation.errors}
                validationWarnings={poolReferenceValidation.warnings}
              />
            </div>
          </TabsContent>

          <TabsContent value="asset-map">
            <AssetMapPanel
              projectId={project.id}
              referenceUsageByAssetId={assetReferenceUsage}
            />
          </TabsContent>

          <TabsContent value="jobs">
            <div className="space-y-4">
              {projectJobs.length === 0 && (
                <p className="text-sm text-ink-muted">No jobs yet.</p>
              )}
              {projectJobs.map((j) => (
                <Card key={j.id} className="border-line bg-panel-elevated/70">
                  <CardHeader className="space-y-2">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="cyan">{j.providerId}</Badge>
                      <Badge variant="lime">{j.modelId}</Badge>
                      <Badge>{j.status}</Badge>
                    </div>
                    <CardTitle className="text-lg">{j.task}</CardTitle>
                    <CardDescription>{j.prompt}</CardDescription>
                    {(j.referenceSelections?.length ?? 0) > 0 && (
                      <div className="rounded-xl border border-line bg-panel px-3 py-2 text-xs text-ink-muted">
                        <span className="font-semibold text-ink-faint">Refs · </span>
                        {j.referenceSelections
                          ?.map((r) => `${r.stableHandle} (${r.role}/${r.priority})`)
                          .join(" · ")}
                      </div>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="receipts">
            <div className="space-y-4">
              {projectReceipts.length === 0 && (
                <p className="text-sm text-ink-muted">No receipts yet.</p>
              )}
              {projectReceipts.map((r) => (
                <Card key={r.id} className="border-line bg-panel-elevated/70">
                  <CardHeader>
                    <CardTitle className="text-base font-mono">{r.id}</CardTitle>
                    <CardDescription>{r.task}</CardDescription>
                    {(r.referenceSelections?.length ?? 0) > 0 && (
                      <div className="mt-2 font-mono text-[11px] text-accent-cyan">
                        {(r.referenceSelections ?? [])
                          .map((x) => x.stableHandle)
                          .join(" · ")}
                      </div>
                    )}
                  </CardHeader>
                  <CardContent className="flex flex-wrap gap-3">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/receipts?highlight=${r.id}`}>Open ledger</Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="prompts" className="space-y-6">
            <Card className="border-line bg-panel-elevated/80">
              <CardHeader>
                <CardTitle>Save operator notes</CardTitle>
                <CardDescription>
                  Lightweight prompt scratchpad — exports ship later.
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3">
                <div className="grid gap-2">
                  <Label>Title</Label>
                  <Input
                    value={promptTitle}
                    onChange={(e) => setPromptTitle(e.target.value)}
                    placeholder="Hero lighting pass"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Body</Label>
                  <Textarea
                    value={promptBody}
                    onChange={(e) => setPromptBody(e.target.value)}
                    placeholder="Continuity tokens, negatives, lens notes…"
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Linked handles (comma-separated)</Label>
                  <Input
                    value={promptHandles}
                    onChange={(e) => setPromptHandles(e.target.value)}
                    placeholder="@HeroFace, @ProductBoard"
                  />
                </div>
                <Button variant="accent" className="w-fit" onClick={savePrompt}>
                  Save prompt note
                </Button>
              </CardContent>
            </Card>
            <div className="space-y-3">
              {prompts.map((p) => (
                <Card key={p.id} className="border-line bg-panel">
                  <CardHeader>
                    <CardTitle className="text-base">{p.title}</CardTitle>
                    <CardDescription>{p.createdAt}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm text-ink-muted whitespace-pre-wrap">
                    {p.linkedHandles && p.linkedHandles.length > 0 && (
                      <div className="font-mono text-xs text-accent-cyan">
                        Handles · {p.linkedHandles.join(", ")}
                      </div>
                    )}
                    {p.body}
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="space-y-5">
          <Card className="border-line-strong bg-panel/95">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Layers className="h-5 w-5 text-accent-lime" />
                Links
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <LinkRow href="/queue" label="Queue" />
              <LinkRow href="/receipts" label="Receipts ledger" />
              <LinkRow href="/providers" label="Provider architecture" />
              <Separator className="bg-line" />
              <LinkRow href="/keys" label="KeyRail console" />
            </CardContent>
          </Card>

          <Card className="border-line bg-panel-elevated/70">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Boxes className="h-4 w-4" />
                Receipt hygiene
              </CardTitle>
              <CardDescription>
                Every finished mock job should mint proof — chase gaps early.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button variant="outline" size="sm" className="w-full" asChild>
                <Link href={`/receipts`}>
                  Browse receipts
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function LinkRow({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between rounded-xl border border-line bg-panel px-3 py-2 text-sm font-medium text-ink-muted hover:border-line-strong hover:text-ink"
    >
      {label}
      <ArrowRight className="h-4 w-4" />
    </Link>
  );
}
