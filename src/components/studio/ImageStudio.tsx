"use client";

/* eslint-disable react-hooks/set-state-in-effect -- hydrates draft state from URL, storage, and storyboard bootstrap */

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  ImageIcon,
  KeyRound,
  Shield,
  Sparkles,
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
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ReferenceBudgetPanel } from "@/components/reference/ReferenceBudgetPanel";
import type { AssetRole } from "@/lib/assetMap/assetMapTypes";
import { suggestedStableHandle } from "@/lib/assetMap/handles";
import { useAssetStore } from "@/lib/assets/assetStore";
import { useCredentialStore } from "@/lib/keyrail/credentialStore";
import { submitStudioGeneration } from "@/lib/jobs/jobRunner";
import { useJobStore } from "@/lib/jobs/jobStore";
import {
  SAMPLE_MANIFESTS,
  getManifestById,
} from "@/lib/models/sampleManifests";
import { computeNetworkDestinations } from "@/lib/providers/networkDestinations";
import { parseGenericModelId } from "@/lib/providers/genericHttpProvider";
import { useProviderConfigStore } from "@/lib/providers/providerConfigStore";
import { loadProviderRegistry } from "@/lib/providers/registry";
import { PROVIDER_CATALOG } from "@/lib/providers/uiCatalog";
import {
  modelIdForComfyTemplate,
  validateComfyTemplate,
} from "@/lib/providers/comfyWorkflowTemplates";
import type {
  GenerationRequest,
  MediaTask,
  ModelManifest,
  ReferenceSelection,
} from "@/lib/providers/types";
import {
  mapPriorityFromSelection,
  selectionPriorityFromMap,
} from "@/lib/reference/referencePriorityBridge";
import { formatProjectKind } from "@/lib/projects/projectKindLabels";
import { useProjectStore } from "@/lib/projects/projectStore";
import { useReceiptStore } from "@/lib/receipts/receiptStore";
import { consumeImageStudioBootstrap } from "@/lib/studio/imageStudioBootstrap";
import { validateReferenceSelections } from "@/lib/validation/referenceValidation";

const DRAFT_PREFIX = "omf:imageDraft:";

function draftKey(projectId: string) {
  return `${DRAFT_PREFIX}${projectId}`;
}

export function ImageStudio() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const projectId = useProjectStore((s) => s.currentProjectId);
  const setCurrentProjectId = useProjectStore((s) => s.setCurrentProjectId);
  const projects = useProjectStore((s) => s.projects);
  const jobs = useJobStore((s) => s.jobs);
  const receipts = useReceiptStore((s) => s.receipts);
  const assets = useAssetStore((s) => s.assets);
  const assetMap = useAssetStore((s) => s.assetMap);
  const upsertMapEntry = useAssetStore((s) => s.upsertMapEntry);
  const providerConfigs = useProviderConfigStore((s) => s.configs);
  const activeProviderConfigs = useProviderConfigStore(
    (s) => s.activeByProviderId,
  );
  const credentials = useCredentialStore((s) => s.credentials);

  const mapForProject = useMemo(
    () =>
      assetMap.filter((e) => !projectId || e.projectId === projectId),
    [assetMap, projectId],
  );

  const studioProviders = useMemo(
    () =>
      loadProviderRegistry().filter((p) =>
        ["mock", "generic-http", "comfyui-local"].includes(p.id),
      ),
    [],
  );
  const plannedProviders = useMemo(
    () =>
      PROVIDER_CATALOG.filter((c) =>
        ["replicate", "fal", "runpod", "modal", "openai", "google"].includes(
          c.id,
        ),
      ),
    [],
  );

  const [providerId, setProviderId] = useState("mock");
  const [studioTask, setStudioTask] = useState<MediaTask>("text-to-image");
  const [modelId, setModelId] = useState("mock-image-v1");
  const [genericCredentialRef, setGenericCredentialRef] = useState("");
  const [prompt, setPrompt] = useState(
    "Cinematic graphite portrait, soft rim light, premium lens character.",
  );
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [selections, setSelections] = useState<ReferenceSelection[]>([]);
  const [pendingShotHandles, setPendingShotHandles] = useState<
    string[] | null
  >(null);

  const activeProject = projects.find((p) => p.id === projectId);
  const manifest = getManifestById(modelId);

  const genericModels = useMemo((): ModelManifest[] => {
    return providerConfigs
      .filter(
        (c) =>
          c.providerId === "generic-http" &&
          c.enabled &&
          c.genericHttp?.task === studioTask,
      )
      .map((c) => getManifestById(`generic-http:${c.id}`))
      .filter((m): m is ModelManifest => Boolean(m));
  }, [providerConfigs, studioTask]);

  const comfyModels = useMemo((): ModelManifest[] => {
    const cfg = providerConfigs.find(
      (c) => c.id === activeProviderConfigs["comfyui-local"],
    );
    if (!cfg?.comfy || !cfg.enabled) return [];
    return cfg.comfy.templates
      .filter((t) => t.task === studioTask && validateComfyTemplate(t).ok)
      .map((t) => getManifestById(modelIdForComfyTemplate(t.id)))
      .filter((m): m is ModelManifest => Boolean(m));
  }, [providerConfigs, activeProviderConfigs, studioTask]);

  const models = useMemo(() => {
    if (providerId === "mock") {
      return SAMPLE_MANIFESTS.filter(
        (m) => m.providerId === "mock" && m.task === studioTask,
      );
    }
    if (providerId === "generic-http") {
      return genericModels;
    }
    if (providerId === "comfyui-local") {
      return comfyModels;
    }
    return [];
  }, [providerId, studioTask, genericModels, comfyModels]);

  const hasComfyProfile = Boolean(
    providerConfigs.find((c) => c.id === activeProviderConfigs["comfyui-local"]),
  );
  const genericHttpEnabled = genericModels.length > 0;
  const comfyRunnable = comfyModels.length > 0;

  const networkPreview = useMemo(() => {
    if (providerId !== "generic-http" && providerId !== "comfyui-local") {
      return [];
    }
    const req: GenerationRequest = {
      projectId: projectId ?? undefined,
      providerId,
      modelId,
      task: studioTask,
      prompt,
      settings: { width: 512, height: 512 },
      inputAssetIds: selections.map((s) => s.assetId),
      referenceSelections: selections,
      outputPolicy: "local-only",
    };
    return computeNetworkDestinations(req);
  }, [
    providerId,
    modelId,
    studioTask,
    prompt,
    projectId,
    selections,
  ]);

  const selectedGenericCfg = useMemo(() => {
    const mid = parseGenericModelId(modelId);
    if (!mid) return undefined;
    return providerConfigs.find((c) => c.id === mid);
  }, [modelId, providerConfigs]);

  const activeJob = activeJobId
    ? jobs.find((j) => j.id === activeJobId)
    : undefined;
  const receipt = receipts.find((r) => r.jobId === activeJob?.id);
  const outputs = assets.filter((a) =>
    activeJob?.outputAssetIds?.includes(a.id),
  );

  const refCandidates = useMemo(() => {
    return assets.filter(
      (a) =>
        (a.projectId === projectId || !projectId) &&
        a.kind === "image" &&
        a.role !== "output",
    );
  }, [assets, projectId]);

  const recentOutputs = useMemo(() => {
    const list = assets.filter((a) => a.kind === "image" && a.role === "output");
    return [...list]
      .sort(
        (a, b) =>
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      )
      .slice(0, 8);
  }, [assets]);

  const handlesLine = useMemo(() => {
    if (selections.length === 0) return "";
    return selections.map((s) => s.stableHandle).join(", ");
  }, [selections]);

  const buildSelectionForAsset = useCallback(
    (assetId: string, priority?: ReferenceSelection["priority"]) => {
      const asset = assets.find((a) => a.id === assetId);
      if (!asset) return null;
      const entry = mapForProject.find((m) => m.assetId === assetId);
      const pri =
        priority ??
        (entry ?
          selectionPriorityFromMap(entry.priority)
        : "guide_style");
      const handle = entry?.stableLabel ?? suggestedStableHandle(asset.label);
      return {
        assetId: asset.id,
        stableHandle: handle.startsWith("@") ? handle : `@${handle}`,
        role: String(asset.role ?? "reference"),
        priority: pri,
      } satisfies ReferenceSelection;
    },
    [assets, mapForProject],
  );

  useEffect(() => {
    const boot = consumeImageStudioBootstrap();
    if (!boot) return;
    if (boot.projectId) {
      setCurrentProjectId(boot.projectId);
    }
    if (boot.prompt) setPrompt(boot.prompt);
    if (boot.referenceHandles?.length) {
      setPendingShotHandles(boot.referenceHandles);
    }
  }, [setCurrentProjectId]);

  useEffect(() => {
    if (!pendingShotHandles?.length || !projectId) return;
    const handlesLower = pendingShotHandles.map((h) =>
      h.trim().toLowerCase().replace(/^@/, ""),
    );
    const nextSel: ReferenceSelection[] = [];
    for (const e of assetMap.filter((x) => x.projectId === projectId)) {
      const hl = e.stableLabel.toLowerCase().replace(/^@/, "");
      if (handlesLower.includes(hl)) {
        const built = buildSelectionForAsset(e.assetId);
        if (built) nextSel.push(built);
      }
    }
    if (nextSel.length) setSelections(nextSel);
    setPendingShotHandles(null);
  }, [pendingShotHandles, projectId, assetMap, buildSelectionForAsset]);

  useEffect(() => {
    const pick = searchParams.get("pickAsset");
    if (!pick) return;
    const built = buildSelectionForAsset(pick);
    if (built) {
      setSelections((prev) => {
        if (prev.some((s) => s.assetId === pick)) return prev;
        return [...prev, built];
      });
    }
    router.replace("/studio/image", { scroll: false });
  }, [searchParams, router, buildSelectionForAsset]);

  useEffect(() => {
    if (!projectId) return;
    try {
      const raw = localStorage.getItem(draftKey(projectId));
      if (!raw) return;
      const d = JSON.parse(raw) as {
        prompt?: string;
        studioTask?: MediaTask;
        modelId?: string;
        providerId?: string;
        selections?: ReferenceSelection[];
      };
      if (d.prompt) setPrompt(d.prompt);
      if (d.studioTask) setStudioTask(d.studioTask);
      if (d.modelId) setModelId(d.modelId);
      if (d.providerId) setProviderId(d.providerId);
      if (Array.isArray(d.selections)) setSelections(d.selections);
    } catch {
      /* ignore */
    }
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;
    localStorage.setItem(
      draftKey(projectId),
      JSON.stringify({
        prompt,
        studioTask,
        modelId,
        providerId,
        selections,
      }),
    );
  }, [projectId, prompt, studioTask, modelId, providerId, selections]);

  useEffect(() => {
    const first = models[0]?.id;
    if (first && !models.some((m) => m.id === modelId)) {
      setModelId(first);
    }
  }, [models, modelId]);

  function toggleRef(assetId: string) {
    setSelections((prev) => {
      const exists = prev.find((s) => s.assetId === assetId);
      if (exists) return prev.filter((s) => s.assetId !== assetId);
      const built = buildSelectionForAsset(assetId);
      return built ? [...prev, built] : prev;
    });
  }

  function setRefPriority(assetId: string, priority: ReferenceSelection["priority"]) {
    setSelections((prev) =>
      prev.map((s) => (s.assetId === assetId ? { ...s, priority } : s)),
    );
    const entry = mapForProject.find((m) => m.assetId === assetId);
    if (entry && projectId) {
      upsertMapEntry({
        ...entry,
        priority: mapPriorityFromSelection(priority),
      });
    }
  }

  const validated = useMemo(
    () =>
      validateReferenceSelections({
        projectId: projectId ?? undefined,
        task: studioTask,
        manifest,
        selections,
        assets,
        mapEntries: mapForProject,
      }),
    [projectId, studioTask, manifest, selections, assets, mapForProject],
  );
  const valErrors = validated.errors;
  const valWarnings = validated.warnings;

  function insertHandlesIntoPrompt() {
    if (!handlesLine) return;
    const chunk = handlesLine
      .split(", ")
      .map((h) => (h.startsWith("@") ? h : `@${h}`))
      .join(" ");
    setPrompt((p) => (p.trim() ? `${p.trim()} ${chunk}` : chunk));
  }

  async function onSubmit() {
    if (validated.errors.length > 0) return;
    const pid = projectId ?? undefined;
    const inputIds = selections.map((s) => s.assetId);
    const { jobId } = await submitStudioGeneration({
      projectId: pid,
      providerId,
      modelId,
      task: studioTask,
      prompt,
      credentialRef:
        providerId === "generic-http" && genericCredentialRef ?
          genericCredentialRef
        : undefined,
      inputAssetIds: inputIds,
      referenceSelections: selections,
      settings: {
        studio: "image",
        studioTask,
        ...(providerId === "generic-http" && genericCredentialRef ?
          { credentialRef: genericCredentialRef }
        : {}),
      },
    });
    setActiveJobId(jobId);
  }

  const keyMode =
    providerId === "mock" || providerId === "comfyui-local" ? "none"
    : providerId === "generic-http" &&
        (selectedGenericCfg?.authMode === "bearer" ||
          selectedGenericCfg?.authMode === "header" ||
          selectedGenericCfg?.authMode === "custom" ||
          selectedGenericCfg?.authMode === "byok") ?
      "browser-dev"
    : providerId === "generic-http" ? "none"
    : "browser-dev";

  return (
    <div className="flex min-h-[calc(100vh-3.5rem)] flex-col">
      <div className="border-b border-line bg-panel/90 px-6 py-4 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.25em] text-ink-faint">
              Image studio
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <h1 className="text-2xl font-semibold tracking-tight">
                Command generation
              </h1>
              {activeProject && (
                <Badge variant="lime" className="font-normal normal-case">
                  Project · {activeProject.title}
                </Badge>
              )}
            </div>
            <p className="mt-2 max-w-2xl text-sm text-ink-muted">
              Mock proves receipts with zero keys. ComfyUI runs on your machine.
              Generic HTTP sends payloads to endpoints you configure — inspect the
              network preview before submit.
            </p>
          </div>
          {!activeProject && (
            <Button variant="outline" size="sm" asChild>
              <Link href="/projects">Attach a project</Link>
            </Button>
          )}
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[1600px] flex-1 gap-6 px-6 py-8 lg:grid-cols-[minmax(280px,340px)_minmax(0,1fr)_minmax(280px,340px)]">
        <div className="flex flex-col gap-6">
          <Card className="border-line-strong bg-panel-elevated/80">
            <CardHeader>
              <CardTitle className="text-lg">Compose</CardTitle>
              <CardDescription>
                Routes through KeyRail execution tickets — refs stay as asset
                IDs only.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5">
              <div className="grid gap-2">
                <Label>Provider</Label>
                <Select value={providerId} onValueChange={setProviderId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Provider" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>Demo lane</SelectLabel>
                      {studioProviders
                        .filter((p) => p.id === "mock")
                        .map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Local compute</SelectLabel>
                      {studioProviders
                        .filter((p) => p.id === "comfyui-local")
                        .map((p) => (
                          <SelectItem
                            key={p.id}
                            value={p.id}
                            disabled={!comfyRunnable}
                            textValue={p.name}
                          >
                            {p.name}
                            {!comfyRunnable ?
                              " · add runnable template"
                            : ""}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>BYO endpoint</SelectLabel>
                      {studioProviders
                        .filter((p) => p.id === "generic-http")
                        .map((p) => (
                          <SelectItem
                            key={p.id}
                            value={p.id}
                            disabled={!genericHttpEnabled}
                            textValue={p.name}
                          >
                            {p.name}
                            {!genericHttpEnabled ?
                              " · configure in Providers"
                            : ""}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>Planned BYOK (disabled)</SelectLabel>
                      {plannedProviders.map((p) => (
                        <SelectItem key={p.id} value={p.id} disabled>
                          {p.name} · placeholder
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              </div>
              {providerId === "generic-http" && (
                <div className="rounded-xl border border-warning/40 bg-warning/10 px-3 py-3 text-xs text-warning">
                  <div className="font-semibold uppercase tracking-wide">
                    Advanced BYO endpoint
                  </div>
                  <p className="mt-2 text-warning/95">
                    Generic HTTP sends request data to your configured URL. You are
                    responsible for the remote system and compliance.
                  </p>
                  {networkPreview.length > 0 && (
                    <p className="mt-2 font-mono text-[10px] text-warning/90">
                      {networkPreview.join(" · ")}
                    </p>
                  )}
                </div>
              )}
              {providerId === "comfyui-local" && comfyRunnable && (
                <div className="rounded-xl border border-line bg-panel px-3 py-2 text-xs text-ink-muted">
                  <Badge variant="lime" className="mb-2 font-normal normal-case">
                    Local lane
                  </Badge>
                  <p>
                    Runs on your ComfyUI server — manifests map to imported workflow
                    templates.
                  </p>
                </div>
              )}
              {providerId === "comfyui-local" && !comfyRunnable && hasComfyProfile && (
                <p className="text-xs text-ink-muted">
                  Connected profile has no validated template for this task — open
                  Providers → ComfyUI setup.
                </p>
              )}
              {providerId === "generic-http" &&
                (selectedGenericCfg?.authMode === "bearer" ||
                  selectedGenericCfg?.authMode === "header" ||
                  selectedGenericCfg?.authMode === "custom" ||
                  selectedGenericCfg?.authMode === "byok") && (
                  <div className="grid gap-2">
                    <Label>KeyRail credential ref</Label>
                    <Select
                      value={genericCredentialRef || "__none__"}
                      onValueChange={(v) =>
                        setGenericCredentialRef(v === "__none__" ? "" : v)
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Credential" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">None</SelectItem>
                        {credentials
                          .filter((c) => c.providerId === "generic-http")
                          .map((c) => (
                            <SelectItem key={c.id} value={c.id}>
                              {c.label} · {c.id.slice(0, 8)}…
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
              <div className="grid gap-2">
                <Label>Studio task</Label>
                <Select
                  value={studioTask}
                  onValueChange={(v) => setStudioTask(v as MediaTask)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text-to-image">Text → image</SelectItem>
                    <SelectItem value="image-to-image">Image → image</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Model manifest</Label>
                <Select value={modelId} onValueChange={setModelId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Model" />
                  </SelectTrigger>
                  <SelectContent>
                    {models.map((m) => (
                      <SelectItem key={m.id} value={m.id}>
                        {m.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Prompt</Label>
                <Textarea
                  className="min-h-[140px]"
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                />
              </div>
              {selections.length > 0 && (
                <div className="rounded-xl border border-line bg-panel px-3 py-3 text-xs text-ink-muted">
                  <div className="font-semibold uppercase tracking-wide text-ink-faint">
                    Reference handles
                  </div>
                  <p className="mt-2 font-mono text-[11px] text-accent-cyan">
                    {handlesLine || "—"}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3 w-full"
                    onClick={insertHandlesIntoPrompt}
                  >
                    Insert handles into prompt
                  </Button>
                </div>
              )}
              <div className="rounded-xl border border-line bg-panel px-3 py-3 text-xs text-ink-muted">
                <div className="font-semibold uppercase tracking-wide text-ink-faint">
                  Prompt quality hints
                </div>
                <ul className="mt-2 list-disc space-y-1 pl-4">
                  <li>Lead with lighting + lens language.</li>
                  <li>Name materials (metal, glass skin, fog).</li>
                  <li>Anchor continuity tokens when iterating.</li>
                </ul>
              </div>
              <Button
                variant="accent"
                className="w-full gap-2"
                disabled={valErrors.length > 0}
                onClick={() => void onSubmit()}
              >
                Submit generation job
                <Sparkles className="h-4 w-4" />
              </Button>
              {valErrors.length > 0 && (
                <p className="text-xs text-danger">
                  Fix blocking validation errors before submit.
                </p>
              )}
            </CardContent>
          </Card>

          <Card className="border-line bg-panel/90">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ImageIcon className="h-4 w-4 text-accent-cyan" />
                Reference picks
              </CardTitle>
              <CardDescription>
                Toggle assets from the active project pool; tune preservation tier
                per reference.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {refCandidates.length === 0 && (
                <p className="text-xs text-ink-muted">
                  Import frames into Assets or bind outputs as references first.
                </p>
              )}
              <div className="grid max-h-56 gap-2 overflow-y-auto pr-1">
                {refCandidates.map((a) => {
                  const active = selections.some((s) => s.assetId === a.id);
                  const sel = selections.find((s) => s.assetId === a.id);
                  return (
                    <div
                      key={a.id}
                      className={`rounded-xl border px-3 py-2 text-left text-xs transition-colors ${
                        active
                          ? "border-accent-cyan/60 bg-accent-cyan/10"
                          : "border-line bg-panel hover:border-line-strong"
                      }`}
                    >
                      <button
                        type="button"
                        onClick={() => toggleRef(a.id)}
                        className="flex w-full items-center gap-3 text-left"
                      >
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-black">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={a.uri}
                            alt={a.label}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div>
                          <div className="font-semibold text-ink">{a.label}</div>
                          <div className="text-ink-faint">
                            {(a.role as AssetRole) ?? "reference"}
                          </div>
                        </div>
                      </button>
                      {active && sel && (
                        <div className="mt-2 flex flex-wrap gap-1 border-t border-line/80 pt-2">
                          {(
                            [
                              "must_preserve",
                              "guide_style",
                              "optional_inspiration",
                            ] as const
                          ).map((p) => (
                            <Button
                              key={p}
                              type="button"
                              size="sm"
                              variant={sel.priority === p ? "accent" : "outline"}
                              className="h-7 text-[10px]"
                              onClick={() => setRefPriority(a.id, p)}
                            >
                              {p === "must_preserve" ? "Must preserve"
                              : p === "guide_style" ? "Guide style"
                              : "Optional"}
                            </Button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="flex flex-1 flex-col border-line-strong bg-panel/95">
            <CardHeader>
              <CardTitle>Live surface</CardTitle>
              <CardDescription>
                Queue runner polls until completion — outputs mirror into Assets.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex flex-1 flex-col gap-6">
              {!activeJob && (
                <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed border-line bg-black/40 px-6 py-16 text-center">
                  <Sparkles className="mb-4 h-10 w-10 text-ink-faint" />
                  <p className="text-sm text-ink-muted">
                    Submit a job to render the mock canvas and mint a receipt.
                  </p>
                </div>
              )}
              {activeJob && (
                <>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="cyan">{activeJob.providerId}</Badge>
                    <Badge variant="lime">{activeJob.modelId}</Badge>
                    <Badge>{activeJob.status}</Badge>
                    <Badge variant="muted">
                      est · {activeJob.estimatedCost ?? 0}{" "}
                      {manifest?.estimatedCost?.currency ?? "USD"}
                    </Badge>
                  </div>
                  <Progress value={activeJob.progress} />
                  {activeJob.error && (
                    <p className="text-sm text-danger">{activeJob.error}</p>
                  )}
                  <div className="relative aspect-square w-full overflow-hidden rounded-3xl border border-line bg-black shadow-glow">
                    {outputs[0] ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={outputs[0].uri}
                        alt={outputs[0].label}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center text-sm text-ink-muted">
                        Awaiting frame…
                      </div>
                    )}
                  </div>
                  {activeJob.referenceSelections?.length ? (
                    <div className="rounded-xl border border-line bg-panel px-3 py-2 text-[11px] text-ink-muted">
                      <span className="font-semibold text-ink-faint">Refs · </span>
                      {activeJob.referenceSelections
                        .map((r) => `${r.stableHandle} (${r.priority})`)
                        .join(" · ")}
                    </div>
                  ) : null}
                  {receipt && (
                    <Button variant="accent" asChild className="w-full gap-2">
                      <Link href={`/receipts?highlight=${receipt.id}`}>
                        Open receipt
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  )}
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-line bg-panel-elevated/70">
            <CardHeader>
              <CardTitle className="text-base">Recent outputs</CardTitle>
              <CardDescription>
                Latest renders tagged as outputs — scroll-ready strip.
              </CardDescription>
            </CardHeader>
            <CardContent className="flex gap-3 overflow-x-auto pb-2">
              {recentOutputs.map((a) => (
                <div
                  key={a.id}
                  className="w-28 shrink-0 overflow-hidden rounded-xl border border-line bg-black"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={a.uri}
                    alt={a.label}
                    className="aspect-square h-28 w-full object-cover"
                  />
                  <div className="truncate px-2 py-1 text-[10px] text-ink-muted">
                    {a.label}
                  </div>
                </div>
              ))}
              {recentOutputs.length === 0 && (
                <p className="text-xs text-ink-muted">
                  Outputs appear after mock completions.
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card className="border-line bg-panel-elevated/80">
            <CardHeader>
              <CardTitle className="text-base">Manifest summary</CardTitle>
              <CardDescription>{manifest?.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-ink-muted">
              <div className="flex justify-between gap-3">
                <span className="text-ink-faint">Task</span>
                <span className="text-ink">{manifest?.task}</span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-ink-faint">Version</span>
                <span className="font-mono text-xs">{manifest?.version}</span>
              </div>
              <Separator className="bg-line" />
              <div className="flex flex-wrap gap-2">
                {(manifest?.tags ?? []).map((t) => (
                  <Badge key={t} variant="muted">
                    {t}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card className="border-line bg-panel">
            <CardContent className="space-y-4 pt-6">
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-accent-lime" />
                <div>
                  <div className="text-xs uppercase tracking-wide text-ink-faint">
                    Provider trust
                  </div>
                  <div className="text-sm font-semibold">
                    {studioProviders.find((p) => p.id === providerId)?.name ??
                      PROVIDER_CATALOG.find((c) => c.id === providerId)?.name}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <BadgeCheck className="h-5 w-5 text-accent-cyan" />
                <div>
                  <div className="text-xs uppercase tracking-wide text-ink-faint">
                    Model manifest
                  </div>
                  <div className="text-sm font-semibold">{manifest?.name}</div>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <KeyRound className="mt-0.5 h-5 w-5 text-ink-muted" />
                <div>
                  <div className="text-xs uppercase tracking-wide text-ink-faint">
                    Key mode
                  </div>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge variant={keyMode === "none" ? "lime" : "muted"}>
                      {keyMode === "none"
                        ? "No key required"
                        : "Browser-dev vault"}
                    </Badge>
                    <Badge variant="muted">Desktop vault later</Badge>
                    <Badge variant="muted">Server vault later</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <ReferenceBudgetPanel
            manifest={manifest}
            referenceSelections={selections}
            assets={assets}
            mapEntries={mapForProject}
            compact
            validationErrors={valErrors}
            validationWarnings={valWarnings}
          />

          <Card className="border-line-strong bg-panel/95">
            <CardHeader>
              <CardTitle className="text-base">Receipt preview</CardTitle>
              <CardDescription>
                Minted when job completes — credential refs only.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 font-mono text-[11px] text-ink-muted">
              {!receipt && (
                <p>Finish a job to preview structured provenance.</p>
              )}
              {receipt && (
                <>
                  <PreviewRow label="job" value={receipt.jobId} />
                  <PreviewRow label="provider" value={receipt.providerId} />
                  <PreviewRow label="model" value={receipt.modelId} />
                  <PreviewRow label="task" value={receipt.task} />
                  <PreviewRow
                    label="credentialRef"
                    value={receipt.credentialRef ?? "—"}
                  />
                  <PreviewRow label="local/remote" value={receipt.localOrRemote} />
                  <PreviewRow
                    label="inputs"
                    value={receipt.inputAssetIds.join(", ") || "—"}
                  />
                  <PreviewRow
                    label="refs"
                    value={
                      receipt.referenceSelections
                        ?.map((r) => `${r.stableHandle}:${r.priority}`)
                        .join(" · ") || "—"
                    }
                  />
                  <PreviewRow
                    label="estimated"
                    value={String(receipt.estimatedCost ?? "—")}
                  />
                  <PreviewRow
                    label="network"
                    value={receipt.networkDestinations?.join(", ") || "none"}
                  />
                  <Separator className="bg-line" />
                  <p className="text-[10px] leading-relaxed text-ink-faint">
                    {receipt.prompt}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          {activeProject && (
            <Card className="border-line bg-panel/90">
              <CardContent className="flex items-center justify-between gap-4 pt-6">
                <div>
                  <div className="text-xs uppercase tracking-wide text-ink-faint">
                    Active format
                  </div>
                  <div className="text-sm font-semibold">
                    {formatProjectKind(activeProject.projectKind)}
                  </div>
                </div>
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/projects/${activeProject.id}`}>Workspace</Link>
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1 rounded-lg border border-line bg-panel px-3 py-2">
      <span className="text-[10px] uppercase tracking-wide text-ink-faint">
        {label}
      </span>
      <span className="text-xs text-ink">{value}</span>
    </div>
  );
}
