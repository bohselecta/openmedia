import "./polyfillLocalStorage";
import assert from "node:assert/strict";
import type { AssetMapEntry } from "../src/lib/assetMap/assetMapTypes";
import type { ReferenceBudgetWarningKind } from "../src/lib/referenceBudget/referenceBudgetTypes";
import type { GenerationJob } from "../src/lib/jobs/jobTypes";
import { submitStudioGeneration } from "../src/lib/jobs/jobRunner";
import { writeReceiptFromJob } from "../src/lib/jobs/receipt";
import { useJobStore } from "../src/lib/jobs/jobStore";
import { mintExecutionTicket } from "../src/lib/keyrail/executionTickets";
import { buildProjectPacket } from "../src/lib/export/projectPacket";
import { SAMPLE_MANIFESTS } from "../src/lib/models/sampleManifests";
import type { Project } from "../src/lib/projects/projectTypes";
import {
  resetMockRuntimeForTests,
} from "../src/lib/providers/mockProvider";
import {
  getProviderById,
  loadProviderRegistry,
} from "../src/lib/providers/registry";
import type { GenerationRequest } from "../src/lib/providers/types";
import { useReceiptStore } from "../src/lib/receipts/receiptStore";

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
  });
  assert.ok(pkt.warning.includes("not embedded"));
  assert.equal(pkt.appName, "OpenMediaForge");

  console.log("[OK] verify_runtime smoke passed");
}

main().catch((err) => {
  console.error("[FAIL] verify_runtime", err);
  process.exit(1);
});
