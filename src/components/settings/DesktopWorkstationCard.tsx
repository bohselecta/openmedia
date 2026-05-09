"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { FolderOpen, HardDrive } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAppStorageMode } from "@/lib/desktop/trustDiagnostics";

function subscribeDesktop() {
  return () => {};
}

function getDesktopSnapshot() {
  return (
    typeof window !== "undefined" && Boolean(window.omfDesktop?.enabled)
  );
}

function getServerSnapshot() {
  return false;
}

export function DesktopWorkstationCard() {
  const desktop = useSyncExternalStore(
    subscribeDesktop,
    getDesktopSnapshot,
    getServerSnapshot,
  );
  const [workspace, setWorkspace] = useState<string | null>(null);

  useEffect(() => {
    const d = typeof window !== "undefined" ? window.omfDesktop : undefined;
    if (!d?.workspaceGet) return;
    void d.workspaceGet().then(setWorkspace);
  }, []);

  async function pickWorkspace() {
    const d = window.omfDesktop;
    if (!d?.workspacePick) return;
    const p = await d.workspacePick();
    setWorkspace(p);
  }

  if (!desktop) {
    return (
      <Card className="border-line bg-panel-elevated/80">
        <CardHeader className="flex flex-row items-center gap-3 space-y-0">
          <HardDrive className="h-6 w-6 text-accent-cyan" />
          <div>
            <CardTitle>Desktop workstation</CardTitle>
            <CardDescription>
              Run{" "}
              <code className="rounded bg-black/40 px-1 text-[11px]">
                npm run desktop:dev
              </code>{" "}
              for SQLite-backed storage, OS keychain secrets, and filesystem
              authority — same UI as the web build.
            </CardDescription>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="border-line bg-panel-elevated/80">
      <CardHeader className="flex flex-row items-center gap-3 space-y-0">
        <FolderOpen className="h-6 w-6 text-accent-lime" />
        <div>
          <CardTitle>Desktop workstation</CardTitle>
          <CardDescription>
            Workspace root — project folders and exports stay under this directory.
            Secrets use the OS keychain when you pick &quot;desktop-keychain&quot; in Keys.
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 text-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="cyan">Electron shell</Badge>
          <Badge variant="muted">{window.omfDesktop?.platform}</Badge>
          <Badge variant="lime">Storage: {getAppStorageMode()}</Badge>
        </div>
        <p className="break-all font-mono text-xs text-ink-muted">
          {workspace ?? "No workspace selected"}
        </p>
        <Button
          variant="accent"
          size="sm"
          className="w-fit"
          onClick={() => void pickWorkspace()}
        >
          Choose workspace folder…
        </Button>
      </CardContent>
    </Card>
  );
}
