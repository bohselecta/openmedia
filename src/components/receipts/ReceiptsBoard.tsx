"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProjectStore } from "@/lib/projects/projectStore";
import { useReceiptStore } from "@/lib/receipts/receiptStore";
import type { GenerationReceipt } from "@/lib/receipts/receiptTypes";

export function ReceiptsBoard() {
  const receipts = useReceiptStore((s) => s.receipts);
  const projects = useProjectStore((s) => s.projects);
  const params = useSearchParams();
  const highlightReceiptId = params.get("highlight");
  const highlightJobId = params.get("jobId");

  const [projectFilter, setProjectFilter] = useState<string>("all");
  const [providerFilter, setProviderFilter] = useState<string>("all");
  const [taskFilter, setTaskFilter] = useState<string>("all");
  const [detailId, setDetailId] = useState<string | null>(null);

  const sorted = useMemo(
    () =>
      [...receipts].sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      ),
    [receipts],
  );

  const filtered = useMemo(() => {
    return sorted.filter((r) => {
      if (projectFilter !== "all" && r.projectId !== projectFilter) {
        return false;
      }
      if (providerFilter !== "all" && r.providerId !== providerFilter) {
        return false;
      }
      if (taskFilter !== "all" && r.task !== taskFilter) {
        return false;
      }
      return true;
    });
  }, [sorted, projectFilter, providerFilter, taskFilter]);

  const providers = useMemo(
    () => [...new Set(receipts.map((r) => r.providerId))],
    [receipts],
  );
  const tasks = useMemo(
    () => [...new Set(receipts.map((r) => r.task))],
    [receipts],
  );

  function exportJson(r: GenerationReceipt) {
    const blob = new Blob([JSON.stringify(r, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `receipt-${r.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function copyJson(r: GenerationReceipt) {
    void navigator.clipboard.writeText(JSON.stringify(r, null, 2));
  }

  function exportLedgerJson(rows: GenerationReceipt[]) {
    const blob = new Blob([JSON.stringify(rows, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `openmediaforge-receipt-ledger-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="mx-auto max-w-6xl px-8 py-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
          Receipts
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          Production ledger
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-muted">
          Immutable provenance records — prompts, models, IO pointers, spend,
          network posture, and credential refs only. Raw secrets never appear.
        </p>
      </div>

      <div className="mt-10 flex flex-wrap items-end gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => exportLedgerJson(sorted)}
        >
          Export ledger (JSON)
        </Button>
        <FilterSelect
          label="Project"
          value={projectFilter}
          onChange={setProjectFilter}
          options={[
            { value: "all", label: "All projects" },
            ...projects.map((p) => ({ value: p.id, label: p.title })),
          ]}
        />
        <FilterSelect
          label="Provider"
          value={providerFilter}
          onChange={setProviderFilter}
          options={[
            { value: "all", label: "All providers" },
            ...providers.map((p) => ({ value: p, label: p })),
          ]}
        />
        <FilterSelect
          label="Task"
          value={taskFilter}
          onChange={setTaskFilter}
          options={[
            { value: "all", label: "All tasks" },
            ...tasks.map((t) => ({ value: t, label: t })),
          ]}
        />
      </div>

      <div className="mt-10 space-y-4">
        {filtered.length === 0 && (
          <Card className="border-dashed border-line bg-panel/70">
            <CardHeader>
              <CardTitle>No receipts match</CardTitle>
              <CardDescription>
                Finish a mock job or widen filters to see entries.
              </CardDescription>
            </CardHeader>
          </Card>
        )}
        {filtered.map((r) => {
          const emphasized =
            r.id === highlightReceiptId || r.jobId === highlightJobId;
          const open = detailId === r.id;
          return (
            <Card
              key={r.id}
              className={`border-line bg-panel-elevated/70 ${emphasized ? "ring-1 ring-accent-lime/50" : ""}`}
            >
              <CardHeader className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="cyan">{r.providerId}</Badge>
                  <Badge variant="lime">{r.modelId}</Badge>
                  <Badge>{r.task}</Badge>
                  <Badge variant="muted">{r.localOrRemote}</Badge>
                </div>
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <CardTitle className="text-xl font-mono">{r.id}</CardTitle>
                    <CardDescription className="mt-2 line-clamp-2">
                      {r.prompt}
                    </CardDescription>
                  </div>
                  <div className="text-xs text-ink-muted">
                    {new Date(r.createdAt).toLocaleString()}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={open ? "accent" : "outline"}
                    size="sm"
                    onClick={() => setDetailId(open ? null : r.id)}
                  >
                    {open ? "Hide detail" : "Receipt detail"}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => copyJson(r)}>
                    Copy JSON
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => exportJson(r)}>
                    Export JSON
                  </Button>
                </div>
                {open && <ReceiptDetail receipt={r} />}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="grid gap-2">
      <span className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </span>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-[200px] border-line bg-panel-elevated">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.value} value={o.value}>
              {o.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ReceiptDetail({ receipt }: { receipt: GenerationReceipt }) {
  return (
    <div className="space-y-4 text-sm text-ink-muted">
      <div className="grid gap-3 md:grid-cols-2">
        <Field label="Prompt" value={receipt.prompt ?? "—"} />
        <Field label="Model" value={receipt.modelId} />
        <Field label="Provider" value={receipt.providerId} />
        <Field label="Credential ref" value={receipt.credentialRef ?? "—"} />
        <Field label="Task" value={receipt.task} />
        <Field label="Local / remote" value={receipt.localOrRemote} />
        <Field
          label="Estimated cost"
          value={String(receipt.estimatedCost ?? "—")}
        />
        <Field
          label="Actual cost"
          value={String(receipt.actualCost ?? "—")}
        />
        <Field
          label="Network destinations"
          value={receipt.networkDestinations?.join(", ") || "none"}
        />
        <Field
          label="Created"
          value={new Date(receipt.createdAt).toLocaleString()}
        />
      </div>
      <Separator />
      <div className="rounded-xl border border-line bg-panel p-3">
        <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
          Reference selections
        </div>
        <div className="mt-2 space-y-2 text-xs">
          {(receipt.referenceSelections?.length ?? 0) === 0 && (
            <span className="text-ink-muted">None recorded.</span>
          )}
          {(receipt.referenceSelections ?? []).map((r) => (
            <div
              key={`${r.assetId}-${r.stableHandle}`}
              className="rounded-lg border border-line-strong bg-panel-elevated/40 px-2 py-2 font-mono text-[11px]"
            >
              <div>{r.stableHandle}</div>
              <div className="text-ink-muted">
                role {r.role} · priority {r.priority}
                {r.note ? ` · ${r.note}` : ""}
              </div>
              <div className="text-ink-faint">asset {r.assetId}</div>
            </div>
          ))}
        </div>
      </div>
      <Separator />
      <div className="grid gap-3 md:grid-cols-2">
        <div className="rounded-xl border border-line bg-panel p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            Inputs
          </div>
          <div className="mt-2 font-mono text-xs">
            {receipt.inputAssetIds.join(", ") || "—"}
          </div>
        </div>
        <div className="rounded-xl border border-line bg-panel p-3">
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            Outputs
          </div>
          <div className="mt-2 font-mono text-xs">
            {receipt.outputAssetIds.join(", ") || "—"}
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line bg-panel p-3">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        {label}
      </div>
      <div className="mt-2 text-xs text-ink">{value}</div>
    </div>
  );
}
