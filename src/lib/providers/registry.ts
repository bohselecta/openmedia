import type { GenerationProvider } from "@/lib/providers/types";
import { comfyProvider } from "@/lib/providers/comfyProvider";
import { genericHttpProvider } from "@/lib/providers/genericHttpProvider";
import { mockProvider } from "@/lib/providers/mockProvider";
import { replicateProvider } from "@/lib/providers/replicateProvider";
import { sdcppProvider } from "@/lib/providers/sdcppProvider";
import { wan2gpProvider } from "@/lib/providers/wan2gpProvider";

let cached: GenerationProvider[] | null = null;

export function loadProviderRegistry(): GenerationProvider[] {
  if (cached) return cached;
  cached = [
    mockProvider,
    genericHttpProvider,
    comfyProvider,
    replicateProvider,
    sdcppProvider,
    wan2gpProvider,
  ];
  return cached;
}

export function getProviderById(id: string): GenerationProvider | undefined {
  return loadProviderRegistry().find((p) => p.id === id);
}

export function invalidateProviderRegistryCache() {
  cached = null;
}
