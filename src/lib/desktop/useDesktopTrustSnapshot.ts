"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { useCredentialStore } from "@/lib/keyrail/credentialStore";
import {
  describeAppMode,
  describeKeyModeSurface,
  getAppStorageMode,
  inferKeyStoragePosture,
} from "@/lib/desktop/trustDiagnostics";

export type OmfRuntimeInfo = {
  packaged: boolean;
  nextDevServer: boolean;
  appVersion: string;
  platform: string;
  keytarModuleLoaded: boolean;
  nextPort: number | null;
};

export type DesktopTrustSnapshot = {
  appMode: string;
  storageMode: string;
  keyMode: string;
  workspaceFolder: string;
  packetExport: "available" | "unavailable";
  appVersion: string;
  platform: string;
};

const webVersion =
  typeof process !== "undefined" &&
  process.env.NEXT_PUBLIC_OMF_APP_VERSION ?
    process.env.NEXT_PUBLIC_OMF_APP_VERSION
  : "unknown";

const clientSubscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function useDesktopTrustSnapshot(): DesktopTrustSnapshot {
  const credentials = useCredentialStore((s) => s.credentials);
  const mounted = useSyncExternalStore(
    clientSubscribe,
    clientSnapshot,
    serverSnapshot,
  );
  const [workspace, setWorkspace] = useState<string | null>(null);
  const [runtime, setRuntime] = useState<OmfRuntimeInfo | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (typeof window === "undefined") return;
      const d = window.omfDesktop;
      if (d?.workspaceGet) {
        try {
          const w = await d.workspaceGet();
          if (!cancelled) setWorkspace(w);
        } catch {
          if (!cancelled) setWorkspace(null);
        }
      } else {
        setWorkspace(null);
      }
      if (d?.getRuntimeInfo) {
        try {
          const r = await d.getRuntimeInfo();
          if (!cancelled) setRuntime(r as OmfRuntimeInfo);
        } catch {
          if (!cancelled) setRuntime(null);
        }
      } else {
        setRuntime(null);
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, []);

  const hasBridge = typeof window !== "undefined" && !!window.omfDesktop?.enabled;
  const storage = getAppStorageMode();
  const storageLabel =
    storage === "desktop-sqlite-kv" ?
      "desktop SQLite KV"
    : "IndexedDB / localForage";

  const posture = inferKeyStoragePosture(credentials);

  if (!mounted) {
    return {
      appMode: "…",
      storageMode: "…",
      keyMode: "…",
      workspaceFolder: "…",
      packetExport: "unavailable",
      appVersion: webVersion,
      platform: "…",
    };
  }

  const appMode = describeAppMode({
    hasBridge,
    packaged: runtime?.packaged ?? false,
    nextDevServer: runtime?.nextDevServer ?? false,
  });

  const keyMode = describeKeyModeSurface({
    hasBridge,
    keytarModuleLoaded: runtime?.keytarModuleLoaded ?? false,
    posture,
  });

  const workspaceFolder =
    !hasBridge ? "N/A (web)"
    : workspace ? `selected (${workspace})`
    : "missing";

  const packetExport =
    hasBridge && typeof window.omfDesktop?.exportZip === "function" ?
      "available"
    : "unavailable";

  const appVersion = hasBridge ? (runtime?.appVersion ?? "…") : webVersion;
  const platform =
    hasBridge ?
      runtime?.platform ?? "…"
    : typeof navigator !== "undefined" ?
      `${navigator.userAgent.includes("Linux") ? "linux" : navigator.platform || "browser"}`
    : "—";

  return {
    appMode,
    storageMode: storageLabel,
    keyMode,
    workspaceFolder,
    packetExport,
    appVersion,
    platform,
  };
}
