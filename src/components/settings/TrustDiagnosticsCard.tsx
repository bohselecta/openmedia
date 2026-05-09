"use client";

import { useDesktopTrustSnapshot } from "@/lib/desktop/useDesktopTrustSnapshot";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function TrustDiagnosticsCard() {
  const snap = useDesktopTrustSnapshot();

  return (
    <Card className="border-line bg-panel-elevated/80">
      <CardHeader>
        <CardTitle className="text-lg">Local trust check</CardTitle>
        <CardDescription>
          v0.5.2-alpha — how this session stores data and handles secrets.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-ink-muted">
        <dl className="grid gap-2 sm:grid-cols-[10rem_1fr] sm:gap-x-4">
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            App mode
          </dt>
          <dd>{snap.appMode}</dd>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            Storage
          </dt>
          <dd>{snap.storageMode}</dd>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            Key surface
          </dt>
          <dd className="break-words">{snap.keyMode}</dd>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            Workspace
          </dt>
          <dd className="break-all">{snap.workspaceFolder}</dd>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            Packet export
          </dt>
          <dd>{snap.packetExport}</dd>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            Version
          </dt>
          <dd>{snap.appVersion}</dd>
          <dt className="text-xs font-medium uppercase tracking-wide text-ink-faint">
            Platform
          </dt>
          <dd>{snap.platform}</dd>
        </dl>
        <div className="flex flex-wrap gap-2 pt-1">
          <Badge variant="cyan">{snap.storageMode}</Badge>
          <Badge variant="lime">{snap.packetExport}</Badge>
        </div>
        <p className="text-xs leading-relaxed">
          Desktop packaged builds bundle a production Next.js standalone server
          (no dev server). SQLite KV and workspace paths live under the OS app
          data directory; packets and receipts never embed raw vault material.
        </p>
      </CardContent>
    </Card>
  );
}
