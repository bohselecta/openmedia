import "./polyfillLocalStorage";
import assert from "node:assert/strict";
import type { AssetMapEntry } from "../src/lib/assetMap/assetMapTypes";
import type { ReferenceBudgetWarningKind } from "../src/lib/referenceBudget/referenceBudgetTypes";
import type { GenerationJob } from "../src/lib/jobs/jobTypes";
import { submitStudioGeneration } from "../src/lib/jobs/jobRunner";
import { writeReceiptFromJob } from "../src/lib/jobs/receipt";
import { useJobStore } from "../src/lib/jobs/jobStore";
import { mintExecutionTicket } from "../src/lib/keyrail/executionTickets";
import { buildProjectPacket, projectPacketToJson } from "../src/lib/export/projectPacket";
import {
  packetJsonLikelyContainsSecretMaterial,
  parseProjectPacketJson,
} from "../src/lib/export/projectPacketSchema";
import { getManifestById, SAMPLE_MANIFESTS } from "../src/lib/models/sampleManifests";
import type { Project } from "../src/lib/projects/projectTypes";
import {
  resetMockRuntimeForTests,
} from "../src/lib/providers/mockProvider";
import {
  getProviderById,
  loadProviderRegistry,
} from "../src/lib/providers/registry";
import type { GenerationRequest, ProviderConfig } from "../src/lib/providers/types";
import { useReceiptStore } from "../src/lib/receipts/receiptStore";
import { useProviderConfigStore } from "../src/lib/providers/providerConfigStore";
import { useProviderRunLogStore } from "../src/lib/providers/providerRunLog";
import { validateGenericHttpConfig } from "../src/lib/providers/genericHttpProvider";
import { testComfyProviderConfig } from "../src/lib/providers/comfyConfigTest";
import { comfyProvider } from "../src/lib/providers/comfyProvider";
import {
  parseGenericHttpRecipeJson,
} from "../src/lib/recipe/importGenericHttpRecipe";

async function sleep(ms: number) {
  await new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const satisfiesAssetMap = null as unknown as AssetMapEntry | null;
  const satisfiesBudget =
    "too-many-references" as ReferenceBudgetWarningKind;
  assert.ok(satisfiesBudget.length > 0);
  assert.ok(satisfiesAssetMap === null || typeof satisfiesAssetMap === "object");

  resetMockRuntimeForTests();

  const registry = loadProviderRegistry();
  assert.ok(registry.length >= 2, "registry should include mock + placeholders");

  const mock = getProviderById("mock");
  assert.ok(mock, "mock provider missing");
  assert.equal(mock!.id, "mock");

  assert.ok(SAMPLE_MANIFESTS.some((m) => m.id === "mock-image-v1"));

  const request: GenerationRequest = {
    providerId: "mock",
    modelId: "mock-image-v1",
    task: "text-to-image",
    prompt: "verify-runtime smoke",
    settings: {},
    inputAssetIds: [],
    referenceSelections: [],
    outputPolicy: "local-only",
  };

  const validation = await mock!.validate(request);
  assert.ok(validation.ok, validation.errors.join(", "));

  const ticket = mintExecutionTicket({
    request,
    approval: "auto",
    networkDestinations: [],
  });

  const handle = await mock!.submit(request, ticket);
  assert.ok(handle.providerJobId);

  let status = await mock!.poll(handle.providerJobId, ticket);
  while (status.status === "running" || status.status === "queued") {
    await sleep(50);
    status = await mock!.poll(handle.providerJobId, ticket);
  }
  assert.equal(status.status, "completed");
  assert.ok(status.outputAssets?.length);

  const job: GenerationJob = {
    id: "job-verify",
    projectId: "proj-verify",
    providerId: "mock",
    modelId: "mock-image-v1",
    task: "text-to-image",
    status: "completed",
    progress: 100,
    prompt: request.prompt,
    settings: {},
    inputAssetIds: [],
    referenceSelections: [
      {
        assetId: "asset-ref-1",
        stableHandle: "@VerifyRef",
        role: "reference",
        priority: "guide_style",
      },
    ],
    outputAssetIds: ["asset-1"],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
  };

  const receipt = writeReceiptFromJob(job, "1.0.0");
  assert.equal(receipt.jobId, job.id);
  assert.equal(receipt.providerId, "mock");
  assert.equal(receipt.manifestId, job.modelId);
  assert.equal(receipt.ledgerStatus, "succeeded");
  assert.equal(receipt.redactionVersion, "1");
  assert.ok(receipt.prompt?.includes("verify-runtime"));
  assert.equal(receipt.referenceSelections?.length, 1);
  assert.equal(receipt.referenceSelections?.[0]?.stableHandle, "@VerifyRef");

  assert.ok(SAMPLE_MANIFESTS.some((m) => m.id === "mock-image-i2i-v1"));

  resetMockRuntimeForTests();

  const { jobId } = await submitStudioGeneration({
    providerId: "mock",
    modelId: "mock-image-v1",
    task: "text-to-image",
    prompt: "verify-runtime integration ref-pass",
    inputAssetIds: ["virtual-ref"],
    referenceSelections: [
      {
        assetId: "virtual-ref",
        stableHandle: "@VirtualRef",
        role: "reference",
        priority: "must_preserve",
      },
    ],
  });

  let completed: GenerationJob | undefined;
  for (let i = 0; i < 120; i++) {
    await sleep(40);
    completed = useJobStore.getState().jobs.find((j) => j.id === jobId);
    if (completed?.status === "completed") break;
    if (completed?.status === "failed") {
      throw new Error(completed.error ?? "integration job failed");
    }
  }
  assert.equal(completed?.status, "completed");
  assert.equal(completed?.referenceSelections?.length, 1);

  const ledgerRcpt = useReceiptStore
    .getState()
    .receipts.find((r) => r.jobId === jobId);
  assert.ok(ledgerRcpt, "receipt should exist for integration job");
  assert.equal(ledgerRcpt!.referenceSelections?.length, 1);

  const demoProject = {
    id: "demo-export-proj",
    title: "Demo export",
    projectKind: "image-set",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  } satisfies Project;
  const pkt = buildProjectPacket({
    project: demoProject,
    assets: [],
    assetMap: [],
    jobs: completed ? [completed] : [],
    receipts: ledgerRcpt ? [ledgerRcpt] : [],
    shots: [],
    prompts: [],
    credentials: [],
    providerRunLog: [],
    providerConfigs: [],
  });
  assert.equal(pkt.packetSchemaVersion, "0.5.1");
  assert.ok(pkt.warning.toLowerCase().includes("redact"));
  assert.equal(pkt.appName, "OpenMediaForge");
  const json = projectPacketToJson(pkt);
  const leak = packetJsonLikelyContainsSecretMaterial(json);
  assert.equal(leak, null);
  const parsedPkt = parseProjectPacketJson(json);
  assert.ok(parsedPkt.ok);

  const sampleRecipe = {
    exportKind: "openmediaforge-generic-http-recipe" as const,
    version: 1,
    label: "Imported verify recipe",
    providerId: "generic-http" as const,
    kind: "remote" as const,
    baseUrl: "http://127.0.0.1:9999/echo",
    authMode: "none" as const,
    enabled: false,
    genericHttp: {
      method: "POST" as const,
      task: "text-to-image",
      requestTemplateJson: '{"prompt":"{{prompt}}"}',
      responseMapping: { outputUrlPath: "u" },
      polling: { mode: "none" as const, intervalMs: 1000, maxAttempts: 1 },
      outputType: "imageUrl" as const,
    },
  };
  const pr = parseGenericHttpRecipeJson(JSON.stringify(sampleRecipe));
  assert.ok(pr.ok);

  await useProviderConfigStore.getState().hydrate();
  await useProviderRunLogStore.getState().hydrate();

  const invalidGeneric: ProviderConfig = {
    id: "bad-gh",
    providerId: "generic-http",
    label: "x",
    kind: "remote",
    authMode: "none",
    enabled: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  const gv = validateGenericHttpConfig(invalidGeneric);
  assert.ok(!gv.ok);

  const gh = getProviderById("generic-http");
  assert.ok(gh);
  const gmodels = await gh!.listModels();
  assert.ok(Array.isArray(gmodels));

  const origFetch = globalThis.fetch;
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    const url =
      typeof input === "string" ? input
      : input instanceof URL ? input.toString()
      : (input as Request).url;
    if (url.includes("/system_stats")) {
      return new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    if (url.includes("/object_info")) {
      return new Response(JSON.stringify({ node: {} }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response("{}", {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
  const comfyCfg: ProviderConfig = {
    id: "c-test",
    providerId: "comfyui-local",
    label: "c",
    kind: "local",
    baseUrl: "http://127.0.0.1:8188",
    authMode: "none",
    enabled: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    comfy: {
      timeoutMs: 5000,
      pollIntervalMs: 500,
      maxPollAttempts: 5,
      templates: [],
    },
  };
  const tr = await testComfyProviderConfig(comfyCfg);
  assert.ok(tr.ok, tr.message);
  globalThis.fetch = origFetch;

  const comfyModels = await comfyProvider.listModels();
  assert.ok(Array.isArray(comfyModels));

  const reqUnknown = await comfyProvider.validate({
    providerId: "comfyui-local",
    modelId: "comfy:missing-template-id",
    task: "text-to-image",
    prompt: "hello",
    settings: {},
    inputAssetIds: [],
    referenceSelections: [],
    outputPolicy: "local-only",
  });
  assert.ok(!reqUnknown.ok);

  const gc = useProviderConfigStore.getState().createProviderConfig({
    id: "rt-gh",
    providerId: "generic-http",
    label: "rt",
    kind: "remote",
    baseUrl: "http://127.0.0.1:1/",
    authMode: "none",
    enabled: true,
    genericHttp: {
      method: "POST",
      task: "text-to-image",
      requestTemplateJson: '{"p":"{{prompt}}"}',
      responseMapping: { outputUrlPath: "u" },
      polling: { mode: "none", intervalMs: 1000, maxAttempts: 1 },
      outputType: "imageUrl",
    },
  });
  assert.equal(getManifestById(`generic-http:${gc.id}`)?.providerId, "generic-http");
  useProviderConfigStore.getState().deleteProviderConfig(gc.id);

  console.log("[OK] verify_runtime smoke passed");
}

main().catch((err) => {
  console.error("[FAIL] verify_runtime", err);
  process.exit(1);
});
