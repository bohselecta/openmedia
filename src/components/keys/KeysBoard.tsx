"use client";

import { useEffect, useState } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { listAuditEvents } from "@/lib/keyrail/auditLog";
import { omfKeyRail } from "@/lib/keyrail/keyrail";
import { useCredentialStore } from "@/lib/keyrail/credentialStore";
import type { CredentialUseEvent } from "@/lib/keyrail/types";

export function KeysBoard() {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("Browser dev secret");
  const [secret, setSecret] = useState("");
  const [providerId, setProviderId] = useState("mock");

  async function addCredential() {
    await omfKeyRail.createCredential({
      providerId,
      label,
      rawSecret: secret || undefined,
      storageMode: "browser-dev",
      scopes: ["text-to-image"],
    });
    setSecret("");
    setOpen(false);
  }

  const credentials = useCredentialStore((s) => s.credentials);
  const [auditTail, setAuditTail] = useState<CredentialUseEvent[]>([]);

  useEffect(() => {
    void useCredentialStore.getState().hydrate();
  }, []);

  useEffect(() => {
    void listAuditEvents().then((ev) =>
      setAuditTail([...ev].slice(-16).reverse()),
    );
  }, [credentials.length]);

  return (
    <div className="mx-auto max-w-6xl px-8 py-12">
      <div className="flex flex-wrap items-start justify-between gap-8">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
            KeyRail
          </p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
            Trust console
          </h1>
          <p className="mt-5 text-sm leading-relaxed text-ink-muted">
            KeyRail is OpenMediaForge&apos;s trusted access layer. It lets the app
            use provider credentials by reference — with scopes, previews, limits,
            and audit trails — while jobs and receipts carry credential refs only.
          </p>
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">
            Raw secrets never serialize into jobs or receipts; execution tickets
            mediate runs. Desktop keychain and server vault integrations follow the
            same contract.
          </p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="accent">Add credential</Button>
          </DialogTrigger>
          <DialogContent className="border-line-strong bg-panel-elevated">
            <DialogHeader>
              <DialogTitle>Add credential</DialogTitle>
              <DialogDescription className="space-y-3 text-ink-muted">
                <p className="rounded-xl border border-warning/40 bg-warning/10 px-4 py-3 text-sm text-warning">
                  Browser-dev vault is temporary and intended for local demos only.
                  Secrets stay out of receipts, but anyone with device access could
                  extract them from storage.
                </p>
                <p>
                  After saving, the UI will never show the raw secret again — only
                  credential refs and previews.
                </p>
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-3 py-2">
              <div className="grid gap-2">
                <Label>Provider id</Label>
                <Input
                  value={providerId}
                  onChange={(e) => setProviderId(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label>Label</Label>
                <Input value={label} onChange={(e) => setLabel(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Secret (optional for mock)</Label>
                <Input
                  type="password"
                  autoComplete="off"
                  value={secret}
                  onChange={(e) => setSecret(e.target.value)}
                  placeholder="Never shown again after save"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button variant="accent" onClick={() => void addCredential()}>
                Save credential ref
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="mt-12 border-line-strong bg-panel">
        <CardHeader>
          <CardTitle>Usage limits (preview)</CardTitle>
          <CardDescription>
            Policy controls land next — today these are visual placeholders tied to
            KeyRail metadata fields.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <LimitTile title="Max jobs / day" value="∞ (local)" hint="Scoped limits coming." />
          <LimitTile
            title="Max estimated spend / day"
            value="$ policy unset"
            hint="Requires receipts + pricing feeds."
          />
          <LimitTile
            title="Approval over amount"
            value="Manual review later"
            hint="Escalations via execution tickets."
          />
        </CardContent>
      </Card>

      <Card className="mt-8 border-line bg-panel-elevated/70">
        <CardHeader>
          <CardTitle>Recent execution audits</CardTitle>
          <CardDescription>
            Ticket mint + usage events (includes mock runs with no credential).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {auditTail.length === 0 && (
            <p className="text-sm text-ink-muted">
              No audits yet — submit a mock job to mint tickets.
            </p>
          )}
          <div className="grid gap-3 md:grid-cols-2">
            {auditTail.map((ev) => (
              <div
                key={ev.id}
                className="rounded-xl border border-line bg-panel px-3 py-2 text-xs text-ink-muted"
              >
                <div className="font-mono text-[11px] text-ink-faint">
                  ticket {ev.ticketId}
                </div>
                <div className="mt-1">
                  {ev.providerId} · {ev.task} · {ev.modelId}
                </div>
                <div className="mt-1 text-ink-faint">
                  credentialRef · {ev.credentialRef ?? "none (mock OK)"}
                </div>
                <div className="mt-1">
                  {new Date(ev.createdAt).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="mt-8 border-line bg-panel-elevated/70">
        <CardHeader>
          <CardTitle>Credential refs</CardTitle>
          <CardDescription>
            Mock jobs ignore secrets; other adapters resolve via execution tickets
            only.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => void useCredentialStore.getState().hydrate()}
          >
            Refresh list
          </Button>
          {credentials.length === 0 && (
            <p className="text-sm text-ink-muted">
              No credentials yet — add one to exercise KeyRail UI.
            </p>
          )}
          <div className="grid gap-4 md:grid-cols-2">
            {credentials.map((c) => (
              <Card key={c.id} className="border-line bg-panel">
                <CardHeader className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="cyan">{c.providerId}</Badge>
                    <Badge variant="muted">{c.storageMode}</Badge>
                    <Badge variant="lime">{c.status}</Badge>
                  </div>
                  <CardTitle className="text-lg">{c.label}</CardTitle>
                  <CardDescription className="font-mono text-xs">
                    ref · {c.id}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3 text-xs text-ink-muted">
                  <div className="flex flex-wrap gap-3">
                    <span>Scopes: {c.scopes.join(", ") || "—"}</span>
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <span>Preview {c.redactedPreview}</span>
                    {c.lastUsedAt && (
                      <span>Last used {new Date(c.lastUsedAt).toLocaleString()}</span>
                    )}
                  </div>
                  <Separator className="bg-line" />
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void omfKeyRail.testCredential(c.id)}
                    >
                      Test
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => void omfKeyRail.revokeCredential(c.id)}
                    >
                      Revoke
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LimitTile({
  title,
  value,
  hint,
}: {
  title: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-2xl border border-line bg-panel px-4 py-4">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        {title}
      </div>
      <div className="mt-3 text-lg font-semibold text-ink">{value}</div>
      <p className="mt-2 text-xs text-ink-muted">{hint}</p>
    </div>
  );
}
