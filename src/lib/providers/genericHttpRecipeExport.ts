import type { ProviderConfig } from "@/lib/providers/types";

/** Serialize a Generic HTTP config for sharing — never includes credential refs or secrets. */
export function redactedGenericHttpRecipe(
  cfg: ProviderConfig,
): Record<string, unknown> {
  return {
    exportKind: "openmediaforge-generic-http-recipe",
    version: 1,
    label: cfg.label,
    providerId: cfg.providerId,
    kind: cfg.kind,
    baseUrl: cfg.baseUrl,
    authMode: cfg.authMode,
    enabled: cfg.enabled,
    genericHttp: cfg.genericHttp,
    note: "credentialRef omitted — re-bind to your KeyRail credential after import.",
  };
}
