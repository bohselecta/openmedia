import type { ProviderKind } from "@/lib/providers/types";

export type ProviderUiLane = "mock" | "local" | "byok" | "planned-http";

export type ProviderCatalogEntry = {
  id: string;
  name: string;
  kind: ProviderKind;
  lane: ProviderUiLane;
  capabilities: string[];
  authMode: "none" | "BYOK" | "configurable" | "local-daemon" | "OAuth later";
  honesty: string;
};

/** Architecture-facing catalog — merges MVP registry ids with honest future adapters */
export const PROVIDER_CATALOG: ProviderCatalogEntry[] = [
  {
    id: "mock",
    name: "Mock Provider",
    kind: "mock",
    lane: "mock",
    capabilities: ["text-to-image", "deterministic demo outputs"],
    authMode: "none",
    honesty:
      "Fully wired — deterministic placeholder frames, zero external calls.",
  },
  {
    id: "generic-http",
    name: "Generic HTTP",
    kind: "remote",
    lane: "byok",
    capabilities: ["custom endpoints", "manifest-driven tasks"],
    authMode: "configurable",
    honesty:
      "Phase 4 BYO lane — user-defined base URL, templates, and polling. No bundled remote vendor.",
  },
  {
    id: "comfyui-local",
    name: "ComfyUI",
    kind: "local",
    lane: "local",
    capabilities: ["local graphs", "LAN queues"],
    authMode: "local-daemon",
    honesty:
      "Local ComfyUI adapter — uses your /prompt, /history, /view routes with imported workflow templates.",
  },
  {
    id: "stable-diffusion-cpp",
    name: "sd.cpp",
    kind: "local",
    lane: "local",
    capabilities: ["desktop inference", "offline batches"],
    authMode: "local-daemon",
    honesty:
      "Desktop planned — ships when a native bridge is available in OpenMediaForge.",
  },
  {
    id: "wan2gp",
    name: "Wan2GP",
    kind: "hybrid",
    lane: "local",
    capabilities: ["local / LAN video pipelines"],
    authMode: "local-daemon",
    honesty:
      "Placeholder — local or LAN execution only; no fake remote jobs.",
  },
  {
    id: "replicate",
    name: "Replicate",
    kind: "remote",
    lane: "byok",
    capabilities: ["hosted models", "BYOK routing"],
    authMode: "BYOK",
    honesty:
      "BYOK adapter — calls Replicate predictions with user tokens via KeyRail execution tickets (no gateway).",
  },
  {
    id: "fal",
    name: "Fal",
    kind: "remote",
    lane: "byok",
    capabilities: ["fast inference APIs"],
    authMode: "BYOK",
    honesty:
      "Planned BYOK lane — execution tickets only; no bundled vendor keys.",
  },
  {
    id: "runpod",
    name: "RunPod",
    kind: "remote",
    lane: "byok",
    capabilities: ["GPU pods", "custom containers"],
    authMode: "BYOK",
    honesty:
      "BYOK planned — user-supplied endpoints and scoped credentials.",
  },
  {
    id: "modal",
    name: "Modal",
    kind: "remote",
    lane: "byok",
    capabilities: ["serverless GPU", "Python workers"],
    authMode: "BYOK",
    honesty:
      "BYOK planned — jobs will declare provider identity on every receipt.",
  },
  {
    id: "openai",
    name: "OpenAI",
    kind: "remote",
    lane: "byok",
    capabilities: ["images", "video APIs", "assist workflows"],
    authMode: "BYOK",
    honesty:
      "BYOK planned — OpenMediaForge never implies bundled hosted credits.",
  },
  {
    id: "google",
    name: "Google AI",
    kind: "remote",
    lane: "byok",
    capabilities: ["Gemini media", "Vertex-style routing"],
    authMode: "BYOK",
    honesty:
      "BYOK planned — credentials stay in KeyRail, refs only in receipts.",
  },
];
