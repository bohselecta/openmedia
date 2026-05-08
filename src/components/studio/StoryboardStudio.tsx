"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { ArrowRight, Plus, Trash2 } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useProjectStore } from "@/lib/projects/projectStore";
import { queueImageStudioBootstrap } from "@/lib/studio/imageStudioBootstrap";
import type { StoryboardShot } from "@/lib/workspace/workspaceTypes";
import { useWorkspaceStore } from "@/lib/workspace/workspaceStore";

const TASKS = [
  "text-to-image",
  "image-to-video",
  "text-to-video",
  "lip-sync",
  "planned",
];

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `shot-${Date.now()}`;
}

export function StoryboardStudio() {
  const router = useRouter();
  const projectId = useProjectStore((s) => s.currentProjectId);
  const projects = useProjectStore((s) => s.projects);
  const storyboardByProject = useWorkspaceStore(
    (s) => s.storyboardByProject,
  );
  const setShots = useWorkspaceStore((s) => s.setStoryboardShots);

  const activeProject = projects.find((p) => p.id === projectId);
  const shots = useMemo(
    () => (projectId ? storyboardByProject[projectId] ?? [] : []),
    [projectId, storyboardByProject],
  );

  const [draft, setDraft] = useState({
    title: "",
    description: "",
    durationSec: 4,
    visualPrompt: "",
    referenceHandles: "",
    targetTask: "planned",
  });

  const deckJson = useMemo(() => JSON.stringify(shots, null, 2), [shots]);

  function addShot() {
    if (!projectId) return;
    const next: StoryboardShot = {
      id: newId(),
      title: draft.title.trim() || "Untitled shot",
      description: draft.description.trim(),
      durationSec: Number.isFinite(draft.durationSec) ? draft.durationSec : 4,
      visualPrompt: draft.visualPrompt.trim(),
      referenceHandles: draft.referenceHandles
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      targetTask: draft.targetTask,
    };
    setShots(projectId, [...shots, next]);
    setDraft({
      title: "",
      description: "",
      durationSec: 4,
      visualPrompt: "",
      referenceHandles: "",
      targetTask: "planned",
    });
  }

  function removeShot(id: string) {
    if (!projectId) return;
    setShots(
      projectId,
      shots.filter((s) => s.id !== id),
    );
  }

  async function copyDeck() {
    await navigator.clipboard.writeText(deckJson);
  }

  function sendShotToStudio(shot: StoryboardShot) {
    if (!projectId) return;
    queueImageStudioBootstrap({
      prompt: shot.visualPrompt,
      projectId,
      referenceHandles: shot.referenceHandles,
    });
    router.push("/studio/image");
  }

  return (
    <div className="mx-auto max-w-6xl px-8 py-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
          Storyboard
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          Shot planning
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-muted">
          Structure beats before any renderer attaches. Shots stay local and sync
          with your active project — no compute implied here.
        </p>
      </div>

      {!activeProject && (
        <Card className="mt-10 border-warning/40 bg-warning/10">
          <CardHeader>
            <CardTitle>Select a project</CardTitle>
            <CardDescription>
              Pick a production from the top bar so shots bind to the right
              workspace.
            </CardDescription>
          </CardHeader>
        </Card>
      )}

      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-6">
          <Card className="border-line-strong bg-panel-elevated/80">
            <CardHeader>
              <CardTitle>Add shot</CardTitle>
              <CardDescription>
                Reference handles accept Asset Map labels like @HeroFace.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2 md:col-span-2">
                <Label>Title</Label>
                <Input
                  value={draft.title}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, title: e.target.value }))
                  }
                  placeholder="Establish skyline"
                />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label>Description</Label>
                <Textarea
                  value={draft.description}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, description: e.target.value }))
                  }
                  placeholder="Blocking + lens intent"
                />
              </div>
              <div className="grid gap-2">
                <Label>Duration (seconds)</Label>
                <Input
                  type="number"
                  min={1}
                  value={draft.durationSec}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      durationSec: Number(e.target.value),
                    }))
                  }
                />
              </div>
              <div className="grid gap-2">
                <Label>Target task</Label>
                <Select
                  value={draft.targetTask}
                  onValueChange={(v) =>
                    setDraft((d) => ({ ...d, targetTask: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TASKS.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label>Visual prompt</Label>
                <Textarea
                  value={draft.visualPrompt}
                  onChange={(e) =>
                    setDraft((d) => ({ ...d, visualPrompt: e.target.value }))
                  }
                />
              </div>
              <div className="grid gap-2 md:col-span-2">
                <Label>Reference handles (comma-separated)</Label>
                <Input
                  value={draft.referenceHandles}
                  onChange={(e) =>
                    setDraft((d) => ({
                      ...d,
                      referenceHandles: e.target.value,
                    }))
                  }
                  placeholder="@HeroFace, @SkylineRef"
                />
              </div>
              <div className="md:col-span-2">
                <Button
                  variant="accent"
                  className="gap-2"
                  disabled={!projectId}
                  onClick={addShot}
                >
                  <Plus className="h-4 w-4" />
                  Add shot
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            {shots.length === 0 && (
              <p className="text-sm text-ink-muted">
                No shots yet — draft your beat list above.
              </p>
            )}
            {shots.map((shot, idx) => (
              <Card key={shot.id} className="border-line bg-panel">
                <CardHeader className="flex flex-row items-start justify-between gap-4 space-y-0">
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                      Shot {idx + 1}
                    </div>
                    <CardTitle className="mt-2 text-xl">{shot.title}</CardTitle>
                    <CardDescription>{shot.description}</CardDescription>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeShot(shot.id)}
                    aria-label="Remove shot"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardHeader>
                <CardContent className="grid gap-3 text-sm text-ink-muted md:grid-cols-2">
                  <div>
                    <span className="text-ink-faint">Duration · </span>
                    {shot.durationSec}s
                  </div>
                  <div>
                    <span className="text-ink-faint">Task · </span>
                    {shot.targetTask}
                  </div>
                  <div className="md:col-span-2 whitespace-pre-wrap">
                    <span className="text-ink-faint">Visual prompt · </span>
                    {shot.visualPrompt}
                  </div>
                  <div className="md:col-span-2 font-mono text-xs">
                    Refs ·{" "}
                    {shot.referenceHandles.length
                      ? shot.referenceHandles.join(", ")
                      : "—"}
                  </div>
                  <div className="md:col-span-2 flex flex-wrap gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-2"
                      disabled={!projectId}
                      onClick={() => sendShotToStudio(shot)}
                    >
                      Send to Image Studio
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <Card className="h-fit border-line bg-panel-elevated/80">
          <CardHeader>
            <CardTitle className="text-lg">Prompt deck export</CardTitle>
            <CardDescription>
              Copy JSON for producers or drop into reporting tools.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="outline" className="w-full" onClick={() => void copyDeck()}>
              Copy shot JSON
            </Button>
            <pre className="max-h-[420px] overflow-auto rounded-xl border border-line bg-black/40 p-4 text-[11px] leading-relaxed text-ink-muted">
              {deckJson}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
