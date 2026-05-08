"use client";

import { useState } from "react";
import {
  AlertTriangle,
  CheckCircle2,
  Cpu,
  Database,
  Trash2,
} from "lucide-react";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import { hardResetLocalApp } from "@/lib/app/resetLocalApp";

export function SettingsClient({
  appVersion,
  nodeVersion,
  nextVersion,
}: {
  appVersion: string;
  nodeVersion: string;
  nextVersion: string;
}) {
  const [resetOpen, setResetOpen] = useState(false);

  return (
    <div className="mx-auto max-w-4xl px-8 py-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
          Settings
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight">
          Workstation
        </h1>
        <p className="mt-4 text-sm text-ink-muted">
          Runtime posture, storage controls, and verification targets for local
          development.
        </p>
      </div>

      <div className="mt-10 grid gap-6">
        <Card className="border-line bg-panel-elevated/80">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <Cpu className="h-6 w-6 text-accent-cyan" />
            <div>
              <CardTitle>Application</CardTitle>
              <CardDescription>OpenMediaForge bundle identity.</CardDescription>
            </div>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-3 text-sm">
            <Badge variant="muted">v{appVersion}</Badge>
            <Badge variant="cyan">Next {nextVersion}</Badge>
            <Badge variant="muted">{nodeVersion}</Badge>
          </CardContent>
        </Card>

        <Card className="border-line bg-panel-elevated/80">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <Database className="h-6 w-6 text-accent-lime" />
            <div>
              <CardTitle>Storage mode</CardTitle>
              <CardDescription>
                IndexedDB via localForage — projects, assets, jobs, receipts,
                workspace bundles, KeyRail metadata.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="text-sm text-ink-muted">
            Clearing resets all creative history on this device.
          </CardContent>
        </Card>

        <Card className="border-line bg-panel-elevated/80">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <CheckCircle2 className="h-6 w-6 text-success" />
            <div>
              <CardTitle>Verification status</CardTitle>
              <CardDescription>
                CI-equivalent gates ship with the repo — run before shipping UI.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-ink-muted">
            <div className="flex flex-wrap gap-2">
              <code className="rounded-lg bg-black/40 px-2 py-1 text-xs">
                npm run typecheck
              </code>
              <code className="rounded-lg bg-black/40 px-2 py-1 text-xs">
                npm run lint
              </code>
              <code className="rounded-lg bg-black/40 px-2 py-1 text-xs">
                npm run build
              </code>
              <code className="rounded-lg bg-black/40 px-2 py-1 text-xs">
                npm run verify
              </code>
            </div>
            <p className="text-xs">
              Verify bundles Python gates plus runtime smoke for mock provider +
              receipts.
            </p>
          </CardContent>
        </Card>

        <Card className="border-line-strong border-danger/40 bg-panel">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <Trash2 className="h-6 w-6 text-danger" />
            <div>
              <CardTitle>Danger zone</CardTitle>
              <CardDescription>
                Reset irreversibly wipes local IndexedDB stores for this origin.
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent>
            <Dialog open={resetOpen} onOpenChange={setResetOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="border-danger/60 text-danger">
                  Reset local data…
                </Button>
              </DialogTrigger>
              <DialogContent className="border-line-strong bg-panel-elevated">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-danger" />
                    Reset everything?
                  </DialogTitle>
                  <DialogDescription className="text-ink-muted">
                    Projects, assets, jobs, receipts, KeyRail metadata, and
                    storyboard drafts vanish. Export receipts before confirming.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button variant="outline" onClick={() => setResetOpen(false)}>
                    Cancel
                  </Button>
                  <Button
                    variant="accent"
                    className="bg-danger text-white hover:bg-danger/90"
                    onClick={() => void hardResetLocalApp()}
                  >
                    Reset local vault
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>

        <Card className="border-dashed border-line bg-panel/70">
          <CardHeader>
            <CardTitle>Desktop mode</CardTitle>
            <CardDescription>
              Native shells will reuse the same contracts — deeper filesystem +
              keychain access without changing receipt semantics.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    </div>
  );
}
