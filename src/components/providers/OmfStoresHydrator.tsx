"use client";

import { useCredentialStore } from "@/lib/keyrail/credentialStore";
import { useWorkspaceStore } from "@/lib/workspace/workspaceStore";
import { useAssetStore } from "@/lib/assets/assetStore";
import { useJobStore } from "@/lib/jobs/jobStore";
import { useProjectStore } from "@/lib/projects/projectStore";
import { useReceiptStore } from "@/lib/receipts/receiptStore";
import { useEffect, useState } from "react";

export function OmfStoresHydrator({
  children,
}: {
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      await Promise.all([
        useProjectStore.getState().hydrate(),
        useAssetStore.getState().hydrate(),
        useJobStore.getState().hydrate(),
        useReceiptStore.getState().hydrate(),
        useCredentialStore.getState().hydrate(),
        useWorkspaceStore.getState().hydrate(),
      ]);
      if (!cancelled) setReady(true);
    }
    void run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (!ready) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg radial-backdrop">
        <div className="rounded-2xl border border-line bg-panel px-8 py-6 text-sm text-ink-muted shadow-glow">
          Loading local vault…
        </div>
      </div>
    );
  }

  return children;
}
