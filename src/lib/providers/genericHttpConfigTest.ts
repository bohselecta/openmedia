import type { ProviderConfig } from "@/lib/providers/types";
import { useCredentialStore } from "@/lib/keyrail/credentialStore";
import { validateGenericHttpConfig } from "@/lib/providers/genericHttpProvider";

export async function testGenericHttpProviderConfig(
  cfg: ProviderConfig,
): Promise<{ ok: boolean; message: string }> {
  const v = validateGenericHttpConfig(cfg);
  if (!v.ok) {
    return { ok: false, message: v.errors.join(" · ") };
  }
  if (
    cfg.authMode === "bearer" ||
    cfg.authMode === "header" ||
    cfg.authMode === "custom" ||
    cfg.authMode === "byok"
  ) {
    if (!cfg.credentialRef) {
      return { ok: false, message: "Credential ref required for this auth mode." };
    }
    const cred = useCredentialStore
      .getState()
      .credentials.find((c) => c.id === cfg.credentialRef);
    if (!cred) {
      return { ok: false, message: "Credential ref not found in KeyRail." };
    }
  }
  const base = (cfg.baseUrl ?? "").trim();
  try {
    const u = new URL(base);
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), 8000);
    const res = await fetch(u.toString(), {
      method: "GET",
      signal: ctrl.signal,
      headers: { Accept: "*/*" },
    }).catch(() => null);
    clearTimeout(t);
    if (res === null) {
      return {
        ok: true,
        message:
          "Config valid. Host did not respond to GET (offline or CORS) — submit may still work from your environment.",
      };
    }
    return {
      ok: res.ok || res.status === 405 || res.status === 404,
      message: `GET ${u.host} → HTTP ${res.status}. Template and mapping validated.`,
    };
  } catch (e) {
    return {
      ok: false,
      message: e instanceof Error ? e.message : "URL check failed.",
    };
  }
}
