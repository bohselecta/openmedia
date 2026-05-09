"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
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
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getProviderById } from "@/lib/providers/registry";
import { useProviderConfigStore } from "@/lib/providers/providerConfigStore";
import { PROVIDER_CATALOG } from "@/lib/providers/uiCatalog";
import type {
  ComfyWorkflowTemplate,
  GenerationRequest,
  ProviderConfig,
} from "@/lib/providers/types";
import {
  interpolateTemplate,
  modelIdForGenericConfig,
} from "@/lib/providers/genericHttpProvider";
import { redactedGenericHttpRecipe } from "@/lib/providers/genericHttpRecipeExport";
import {
  parseGenericHttpRecipeJson,
  recipeToProviderConfigInput,
} from "@/lib/recipe/importGenericHttpRecipe";
import { newTemplateId, validateComfyTemplate } from "@/lib/providers/comfyWorkflowTemplates";

type StoreApi = ReturnType<typeof useProviderConfigStore.getState>;

function newCfgId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `cfg-${Date.now()}`;
}

function nowIso() {
  return new Date().toISOString();
}

export function ProvidersBoard() {
  const configs = useProviderConfigStore((s) => s.configs);
  const activeBy = useProviderConfigStore((s) => s.activeByProviderId);
  const createCfg = useProviderConfigStore((s) => s.createProviderConfig);
  const updateCfg = useProviderConfigStore((s) => s.updateProviderConfig);
  const deleteCfg = useProviderConfigStore((s) => s.deleteProviderConfig);
  const testCfg = useProviderConfigStore((s) => s.testProviderConfig);
  const setActive = useProviderConfigStore((s) => s.setActiveProviderConfig);

  const [ghOpen, setGhOpen] = useState(false);
  const [comfyOpen, setComfyOpen] = useState(false);
  const [recipeImportOpen, setRecipeImportOpen] = useState(false);
  const [recipeErr, setRecipeErr] = useState<string | null>(null);

  const rows = useMemo(() => {
    return PROVIDER_CATALOG.map((entry) => {
      const adapter = getProviderById(entry.id);
      const ghCount = configs.filter((c) => c.providerId === "generic-http").length;
      const comfy = configs.find((c) => c.id === activeBy["comfyui-local"]);
      const comfyTemplates = comfy?.comfy?.templates.length ?? 0;
      const runnableComfy = comfy?.comfy?.templates.filter(
        (t) => validateComfyTemplate(t).ok,
      ).length ?? 0;

      let status = "Architecture slot · planned";
      if (entry.id === "mock") {
        status = "Connected · demo lane";
      } else if (entry.id === "generic-http") {
        status =
          ghCount > 0 ?
            `${ghCount} saved config(s) — open card to edit`
          : "Configure BYO HTTP endpoint (advanced)";
      } else if (entry.id === "comfyui-local") {
        if (!comfy?.baseUrl) status = "Comfy: not configured";
        else if (!comfy.lastTestAt && comfy.lastTestStatus !== "failed") {
          status = "Comfy: base URL set · reachability not verified yet";
        } else if (comfy.lastTestStatus === "failed") {
          status = "Comfy: unreachable (last connection test failed)";
        } else if (runnableComfy === 0) {
          status = "Comfy: reachable · add a validated workflow template";
        } else {
          status = `Comfy: reachable · ${runnableComfy} runnable template(s)`;
        }
      } else if (entry.id === "replicate") {
        status =
          adapter && adapter.capabilities.length > 0 ?
            "BYOK · Replicate predictions (token + version required)"
          : status;
      } else if (adapter && adapter.capabilities.length === 0) {
        status = "Honest placeholder — not runnable";
      } else if (adapter) {
        status = "Registry entry";
      }
      return { entry, adapter, status };
    });
  }, [configs, activeBy]);

  function addGenericSample(kind: "local" | "image") {
    const id = newCfgId();
    const baseUrl =
      kind === "local" ? "http://127.0.0.1:9999/echo" : "http://127.0.0.1:9999/image";
    createCfg({
      id,
      providerId: "generic-http",
      label:
        kind === "local" ?
          "Example: local test endpoint"
        : "Example: generic image endpoint",
      kind: "remote",
      baseUrl,
      authMode: "none",
      enabled: false,
      genericHttp: {
        method: "POST",
        task: "text-to-image",
        requestTemplateJson: JSON.stringify(
          { prompt: "{{prompt}}", width: "{{settings.width}}", height: "{{settings.height}}" },
          null,
          2,
        ),
        responseMapping: {
          outputUrlPath: "url",
          errorPath: "error",
        },
        polling: { mode: "none", intervalMs: 1000, maxAttempts: 1 },
        outputType: "imageUrl",
      },
    });
  }

  function addComfyDefaults() {
    const id = newCfgId();
    createCfg({
      id,
      providerId: "comfyui-local",
      label: "Local ComfyUI",
      kind: "local",
      baseUrl: "http://127.0.0.1:8188",
      authMode: "none",
      enabled: true,
      comfy: {
        timeoutMs: 120_000,
        pollIntervalMs: 900,
        maxPollAttempts: 180,
        templates: [],
      },
    });
    setActive("comfyui-local", id);
  }

  return (
    <div className="mx-auto max-w-6xl px-8 py-12">
      <div className="flex flex-wrap items-start justify-between gap-6">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
            Providers
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Adapter architecture
          </h1>
          <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-muted">
            OpenMediaForge is provider-neutral: every engine is a manifest-driven
            adapter. Mock is always available; Generic HTTP and local ComfyUI are
            advanced lanes you control — no OpenMediaForge hosted compute.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/providers/activity">Provider activity log</Link>
          </Button>
          <Button variant="outline" size="sm" onClick={() => setRecipeImportOpen(true)}>
            Import HTTP recipe (JSON)
          </Button>
          <Button variant="accent" size="sm" onClick={() => setGhOpen(true)}>
            Generic HTTP setup
          </Button>
          <Button variant="accent" size="sm" onClick={() => setComfyOpen(true)}>
            ComfyUI setup
          </Button>
        </div>
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
              {entry.id === "generic-http" && (
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addGenericSample("local")}
                  >
                    Add sample: local test
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => addGenericSample("image")}
                  >
                    Add sample: image mapping
                  </Button>
                </div>
              )}
              {entry.id === "comfyui-local" && (
                <Button variant="outline" size="sm" onClick={() => addComfyDefaults()}>
                  Create default local profile
                </Button>
              )}
              {adapter && (
                <p className="text-[11px] text-ink-faint">
                  Adapter id · <span className="font-mono">{adapter.id}</span>
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <GenericHttpDialog
        open={ghOpen}
        onOpenChange={setGhOpen}
        configs={configs.filter((c) => c.providerId === "generic-http")}
        onCreate={createCfg}
        onUpdate={updateCfg}
        onDelete={deleteCfg}
        onTest={testCfg}
        onActive={setActive}
        activeId={activeBy["generic-http"]}
      />
      <ComfyDialog
        open={comfyOpen}
        onOpenChange={setComfyOpen}
        configs={configs.filter((c) => c.providerId === "comfyui-local")}
        onCreate={createCfg}
        onUpdate={updateCfg}
        onDelete={deleteCfg}
        onTest={testCfg}
        onActive={setActive}
        activeId={activeBy["comfyui-local"]}
      />

      <Dialog open={recipeImportOpen} onOpenChange={setRecipeImportOpen}>
        <DialogContent className="border-line-strong bg-panel-elevated sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Import Generic HTTP recipe</DialogTitle>
            <DialogDescription className="text-ink-muted">
              Use JSON exported from OpenMediaForge (&quot;redacted recipe&quot;). Raw
              secrets are rejected — bind credentials from Keys after import.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <Label htmlFor="recipe-file">Recipe JSON file</Label>
            <Input
              id="recipe-file"
              type="file"
              accept="application/json,.json"
              className="cursor-pointer"
              onChange={(e) => {
                setRecipeErr(null);
                const input = e.target;
                const f = input.files?.[0];
                if (!f) return;
                void (async () => {
                  const text = await f.text();
                  const r = parseGenericHttpRecipeJson(text);
                  if (!r.ok) {
                    setRecipeErr(r.error);
                    return;
                  }
                  createCfg({
                    ...recipeToProviderConfigInput(r.data),
                    enabled: false,
                  });
                  setRecipeImportOpen(false);
                  input.value = "";
                })();
              }}
            />
            {recipeErr && (
              <p className="text-xs text-danger leading-relaxed">{recipeErr}</p>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRecipeImportOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function GenericHttpDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  configs: ProviderConfig[];
  onCreate: StoreApi["createProviderConfig"];
  onUpdate: StoreApi["updateProviderConfig"];
  onDelete: StoreApi["deleteProviderConfig"];
  onTest: StoreApi["testProviderConfig"];
  onActive: StoreApi["setActiveProviderConfig"];
  activeId?: string;
}) {
  const [label, setLabel] = useState("My HTTP endpoint");
  const [baseUrl, setBaseUrl] = useState("http://127.0.0.1:9999/");
  const [method, setMethod] = useState<"POST" | "GET" | "PUT">("POST");
  const [authMode, setAuthMode] = useState<ProviderConfig["authMode"]>("none");
  const [credentialRef, setCredentialRef] = useState("");
  const [template, setTemplate] = useState(
    '{"prompt":"{{prompt}}","w":{{settings.width}},"h":{{settings.height}}}',
  );
  const [outPath, setOutPath] = useState("data.url");
  const [jobPath, setJobPath] = useState("");
  const [pollMode, setPollMode] = useState<"none" | "get" | "post">("none");
  const [pollUrl, setPollUrl] = useState("http://127.0.0.1:9999/status/{{jobId}}");
  const [testMsg, setTestMsg] = useState<string | null>(null);
  const [dryPreview, setDryPreview] = useState<string | null>(null);

  async function save(enabled: boolean) {
    const row = props.onCreate({
      providerId: "generic-http",
      label,
      kind: "remote",
      baseUrl,
      authMode,
      credentialRef: credentialRef || undefined,
      enabled,
      genericHttp: {
        method,
        task: "text-to-image",
        requestTemplateJson: template,
        responseMapping: {
          outputUrlPath: outPath || undefined,
          jobIdPath: jobPath || undefined,
        },
        polling: {
          mode: pollMode,
          pollUrlTemplate: pollMode === "none" ? undefined : pollUrl,
          intervalMs: 800,
          maxAttempts: 40,
        },
        outputType: "imageUrl",
      },
    });
    props.onActive("generic-http", row.id);
    setTestMsg(null);
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-line-strong bg-panel-elevated sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Generic HTTP</DialogTitle>
          <DialogDescription>
            Advanced lane — requests go only to URLs you configure. Jobs store
            credential refs, never raw secrets.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-3 py-2">
          <div className="grid gap-2">
            <Label>Label</Label>
            <Input value={label} onChange={(e) => setLabel(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Base URL</Label>
            <Input value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Method</Label>
            <Input
              value={method}
              onChange={(e) =>
                setMethod((e.target.value.toUpperCase() as typeof method) || "POST")
              }
            />
          </div>
          <div className="grid gap-2">
            <Label>Auth mode</Label>
            <Input
              value={authMode}
              onChange={(e) => setAuthMode(e.target.value as ProviderConfig["authMode"])}
            />
          </div>
          <div className="grid gap-2">
            <Label>Credential ref (optional)</Label>
            <Input
              value={credentialRef}
              onChange={(e) => setCredentialRef(e.target.value)}
              placeholder="KeyRail credential id"
            />
          </div>
          <div className="grid gap-2">
            <Label>Request JSON template</Label>
            <Textarea
              className="min-h-[120px] font-mono text-xs"
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={() => {
                const previewReq: GenerationRequest = {
                  providerId: "generic-http",
                  modelId: modelIdForGenericConfig("preview"),
                  task: "text-to-image",
                  prompt: "dry-run preview prompt",
                  settings: { width: 512, height: 512 },
                  inputAssetIds: [],
                  referenceSelections: [],
                  outputPolicy: "local-only",
                };
                try {
                  setDryPreview(interpolateTemplate(template, previewReq));
                } catch (e) {
                  setDryPreview(String(e));
                }
              }}
            >
              Preview interpolated JSON (dry-run)
            </Button>
            {dryPreview && (
              <pre className="max-h-48 overflow-auto rounded-lg border border-line bg-black/30 p-3 text-[11px] leading-relaxed">
                {dryPreview}
              </pre>
            )}
          </div>
          <div className="grid gap-2">
            <Label>Response output URL path</Label>
            <Input value={outPath} onChange={(e) => setOutPath(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Job id path (optional)</Label>
            <Input value={jobPath} onChange={(e) => setJobPath(e.target.value)} />
          </div>
          <div className="grid gap-2">
            <Label>Polling mode</Label>
            <Input
              value={pollMode}
              onChange={(e) => setPollMode(e.target.value as typeof pollMode)}
            />
          </div>
          {pollMode !== "none" && (
            <div className="grid gap-2">
              <Label>Poll URL template</Label>
              <Input value={pollUrl} onChange={(e) => setPollUrl(e.target.value)} />
            </div>
          )}
          {testMsg && <p className="text-xs text-ink-muted">{testMsg}</p>}
          <p className="text-[11px] text-ink-faint">
            Use in Image Studio after enabling and passing connection test (
            <span className="font-mono">{modelIdForGenericConfig("…")}</span>).
          </p>
        </div>
        <DialogFooter className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => void save(false)}>
            Save disabled
          </Button>
          <Button variant="accent" onClick={() => void save(true)}>
            Save &amp; enable
          </Button>
        </DialogFooter>
        <div className="border-t border-line pt-4 text-xs text-ink-muted">
          <div className="mb-2 font-semibold text-ink">Saved configs</div>
          {props.configs.length === 0 && <p>No configs yet.</p>}
          {props.configs.map((c) => (
            <div
              key={c.id}
              className="mb-2 flex flex-wrap items-center justify-between gap-2 rounded-lg border border-line bg-panel px-3 py-2"
            >
              <div>
                <div className="font-medium">{c.label}</div>
                <div className="font-mono text-[10px] text-ink-faint">{c.id}</div>
              </div>
              <div className="flex flex-wrap gap-1">
                <Button
                  size="sm"
                  variant={props.activeId === c.id ? "accent" : "outline"}
                  onClick={() => props.onActive("generic-http", c.id)}
                >
                  Active
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    const r = await props.onTest(c.id);
                    setTestMsg(`${c.label}: ${r.message}`);
                  }}
                >
                  Test
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    const blob = new Blob(
                      [JSON.stringify(redactedGenericHttpRecipe(c), null, 2)],
                      { type: "application/json" },
                    );
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement("a");
                    a.href = url;
                    a.download = `omf-generic-http-recipe-${c.id.slice(0, 8)}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                >
                  Export recipe
                </Button>
                <Button size="sm" variant="outline" onClick={() => props.onDelete(c.id)}>
                  Delete
                </Button>
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ComfyDialog(props: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  configs: ProviderConfig[];
  onCreate: StoreApi["createProviderConfig"];
  onUpdate: StoreApi["updateProviderConfig"];
  onDelete: StoreApi["deleteProviderConfig"];
  onTest: StoreApi["testProviderConfig"];
  onActive: StoreApi["setActiveProviderConfig"];
  activeId?: string;
}) {
  const [wf, setWf] = useState("{}");
  const [tplLabel, setTplLabel] = useState("Imported workflow");
  const [task, setTask] = useState<"text-to-image" | "image-to-image">("text-to-image");
  const [promptPath, setPromptPath] = useState("6.inputs.text");
  const [negPromptPath, setNegPromptPath] = useState("");
  const [seedPathField, setSeedPathField] = useState("");
  const [widthPathField, setWidthPathField] = useState("");
  const [heightPathField, setHeightPathField] = useState("");
  const [outNodes, setOutNodes] = useState("9");
  const [msg, setMsg] = useState<string | null>(null);

  const active =
    props.activeId ?
      props.configs.find((c) => c.id === props.activeId)
    : undefined;

  function createLocalProfile() {
    const row = props.onCreate({
      providerId: "comfyui-local",
      label: "Local ComfyUI",
      kind: "local",
      baseUrl: "http://127.0.0.1:8188",
      authMode: "none",
      enabled: true,
      comfy: {
        timeoutMs: 120_000,
        pollIntervalMs: 900,
        maxPollAttempts: 180,
        templates: [],
      },
    });
    props.onActive("comfyui-local", row.id);
  }

  async function applyDesktopComfyDefault(cfgId: string) {
    const d = typeof window !== "undefined" ? window.omfDesktop : undefined;
    if (!d?.defaultComfyBaseUrl) {
      setMsg("Desktop bridge not available in this browser session.");
      return;
    }
    const u = await d.defaultComfyBaseUrl();
    props.onUpdate(cfgId, { baseUrl: u });
    setMsg(`Base URL locked to ${u} — loopback default for local ComfyUI.`);
  }

  function importTemplate() {
    if (!active) {
      setMsg("Create a local profile first.");
      return;
    }
    const reqIn: ComfyWorkflowTemplate["requiredInputs"] = ["prompt"];
    if (negPromptPath.trim()) reqIn.push("negativePrompt");
    if (seedPathField.trim()) reqIn.push("seed");
    if (widthPathField.trim() && heightPathField.trim()) {
      reqIn.push("width", "height");
    }
    const tpl: ComfyWorkflowTemplate = {
      id: newTemplateId(),
      label: tplLabel,
      task,
      workflowJson: wf,
      requiredInputs: reqIn,
      outputNodeIds: outNodes.split(",").map((s) => s.trim()).filter(Boolean),
      promptPath: promptPath || undefined,
      negativePromptPath: negPromptPath.trim() || undefined,
      seedPath: seedPathField.trim() || undefined,
      widthPath: widthPathField.trim() || undefined,
      heightPath: heightPathField.trim() || undefined,
      createdAt: nowIso(),
      updatedAt: nowIso(),
    };
    const v = validateComfyTemplate(tpl);
    if (!v.ok) {
      setMsg(v.errors.join(" · "));
      return;
    }
    const nextTemplates = [...(active.comfy?.templates ?? []), tpl];
    props.onUpdate(active.id, {
      comfy: {
        timeoutMs: active.comfy?.timeoutMs ?? 120_000,
        pollIntervalMs: active.comfy?.pollIntervalMs ?? 900,
        maxPollAttempts: active.comfy?.maxPollAttempts ?? 180,
        templates: nextTemplates,
      },
    });
    setMsg("Template saved.");
  }

  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto border-line-strong bg-panel-elevated sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>ComfyUI (local)</DialogTitle>
          <DialogDescription>
            Uses ComfyUI server routes{" "}
            <span className="font-mono text-[11px]">
              /system_stats /object_info /prompt /history /view
            </span>
            . Paste API workflow JSON and map fields.
          </DialogDescription>
        </DialogHeader>
        {!active && (
          <Button onClick={() => createLocalProfile()}>Create local profile</Button>
        )}
        {active && (
          <div className="grid gap-3 py-2">
            <div className="grid gap-2">
              <Label>Base URL</Label>
              <Input
                value={active.baseUrl ?? ""}
                onChange={(e) => props.onUpdate(active.id, { baseUrl: e.target.value })}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="w-fit"
                onClick={() => void applyDesktopComfyDefault(active.id)}
              >
                Apply desktop local default (127.0.0.1)
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-fit"
              onClick={async () => {
                const r = await props.onTest(active.id);
                setMsg(r.message);
              }}
            >
              Test connection
            </Button>
            <div className="text-xs text-ink-muted">
              Last test: {active.lastTestMessage ?? "—"}
            </div>
            <div className="grid gap-2">
              <Label>Workflow API JSON</Label>
              <Textarea
                className="min-h-[140px] font-mono text-xs"
                value={wf}
                onChange={(e) => setWf(e.target.value)}
              />
            </div>
            <div className="grid gap-2">
              <Label>Template label</Label>
              <Input value={tplLabel} onChange={(e) => setTplLabel(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Task</Label>
              <Input value={task} onChange={(e) => setTask(e.target.value as typeof task)} />
            </div>
            <div className="grid gap-2">
              <Label>Prompt path</Label>
              <Input value={promptPath} onChange={(e) => setPromptPath(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Negative prompt path (optional)</Label>
              <Input value={negPromptPath} onChange={(e) => setNegPromptPath(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Seed path (optional)</Label>
              <Input value={seedPathField} onChange={(e) => setSeedPathField(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Width / height paths (optional pair)</Label>
              <Input value={widthPathField} onChange={(e) => setWidthPathField(e.target.value)} placeholder="e.g. 5.inputs.width" />
              <Input value={heightPathField} onChange={(e) => setHeightPathField(e.target.value)} placeholder="e.g. 5.inputs.height" />
            </div>
            <div className="grid gap-2">
              <Label>Output node ids (comma)</Label>
              <Input value={outNodes} onChange={(e) => setOutNodes(e.target.value)} />
            </div>
            {msg && <p className="text-xs text-warning">{msg}</p>}
            <Button variant="accent" onClick={() => importTemplate()}>
              Validate &amp; save template
            </Button>
            <p className="text-[11px] text-ink-faint">
              /interrupt is used for best-effort cancel and may flush the entire Comfy
              queue.
            </p>
          </div>
        )}
        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
