"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAssetStore } from "@/lib/assets/assetStore";
import { useJobStore } from "@/lib/jobs/jobStore";
import {
  PROJECT_KIND_OPTIONS,
  formatProjectKind,
} from "@/lib/projects/projectKindLabels";
import { useProjectStore } from "@/lib/projects/projectStore";
import type { Project, ProjectKind } from "@/lib/projects/projectTypes";
import { computeProjectStats } from "@/lib/projects/projectStats";
import { useReceiptStore } from "@/lib/receipts/receiptStore";

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `proj-${Date.now()}`;
}

export function ProjectsBoard() {
  const projects = useProjectStore((s) => s.projects);
  const current = useProjectStore((s) => s.currentProjectId);
  const setCurrent = useProjectStore((s) => s.setCurrentProjectId);
  const upsert = useProjectStore((s) => s.upsertProject);
  const assets = useAssetStore((s) => s.assets);
  const jobs = useJobStore((s) => s.jobs);
  const receipts = useReceiptStore((s) => s.receipts);

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<ProjectKind>("image-set");

  const sorted = useMemo(
    () =>
      [...projects].sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [projects],
  );

  function createProject() {
    const now = new Date().toISOString();
    const p: Project = {
      id: newId(),
      title: title.trim() || `Project ${projects.length + 1}`,
      description: "",
      projectKind: kind,
      platformTarget: "other",
      createdAt: now,
      updatedAt: now,
    };
    upsert(p);
    setCurrent(p.id);
    setTitle("");
    setKind("image-set");
    setOpen(false);
  }

  return (
    <div className="mx-auto max-w-7xl px-8 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
            Projects
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Productions
          </h1>
          <p className="mt-4 max-w-2xl text-sm leading-relaxed text-ink-muted">
            Everything routes through an active project — assets, jobs,
            receipts, and KeyRail refs stay linked. Pick a container before you
            ship serious work.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="accent">New project</Button>
          </DialogTrigger>
          <DialogContent className="border-line-strong bg-panel-elevated">
            <DialogHeader>
              <DialogTitle>Create project</DialogTitle>
              <DialogDescription className="text-ink-muted">
                Choose a production type. You can rename anytime.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-2">
              <div className="grid gap-2">
                <Label htmlFor="proj-title">Title</Label>
                <Input
                  id="proj-title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Neon launch film"
                />
              </div>
              <div className="grid gap-2">
                <Label>Type</Label>
                <Select
                  value={kind}
                  onValueChange={(v) => setKind(v as ProjectKind)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    {PROJECT_KIND_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="accent" onClick={createProject}>
                Create & select
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="mt-12 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {sorted.map((p) => {
          const stats = computeProjectStats(p.id, assets, jobs, receipts);
          const selected = current === p.id;
          return (
            <Card
              key={p.id}
              className={`flex flex-col border-line bg-panel-elevated/75 backdrop-blur transition-all ${
                selected ? "ring-1 ring-accent-cyan/50 shadow-glow" : ""
              }`}
            >
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="muted">{formatProjectKind(p.projectKind)}</Badge>
                  {selected && (
                    <Badge variant="lime" className="font-normal normal-case">
                      Active
                    </Badge>
                  )}
                </div>
                <CardTitle className="text-xl leading-snug">{p.title}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {p.description || "No brief yet — add intent in workspace."}
                </CardDescription>
              </CardHeader>
              <CardContent className="grid flex-1 gap-4 text-sm text-ink-muted">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <StatPill label="Assets" value={stats.assetCount} />
                  <StatPill label="Jobs" value={stats.jobCount} />
                  <StatPill label="Receipts" value={stats.receiptCount} />
                </div>
                <div className="rounded-xl border border-line bg-panel px-3 py-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                    Providers used
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {stats.providerIds.length === 0 && (
                      <span className="text-xs text-ink-faint">None yet</span>
                    )}
                    {stats.providerIds.map((id) => (
                      <Badge key={id} variant="cyan">
                        {id}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-xs text-ink-faint">
                  Updated {new Date(p.updatedAt).toLocaleString()}
                </div>
              </CardContent>
              <div className="flex flex-wrap gap-2 border-t border-line bg-black/20 px-6 py-4">
                <Button
                  variant={selected ? "outline" : "accent"}
                  size="sm"
                  onClick={() => setCurrent(p.id)}
                >
                  {selected ? "Selected" : "Make active"}
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/projects/${p.id}`}>Workspace</Link>
                </Button>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/studio/image">Image studio</Link>
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function StatPill({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl border border-line bg-panel px-2 py-3">
      <div className="text-2xl font-semibold tabular-nums text-ink">{value}</div>
      <div className="mt-1 text-[11px] uppercase tracking-wide text-ink-faint">
        {label}
      </div>
    </div>
  );
}
