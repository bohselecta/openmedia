import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  GitBranch,
  Receipt,
  Sparkles,
  Wand2,
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

const nodes = [
  {
    title: "Prompt",
    body: "Structured intent + continuity tokens enter the graph.",
    icon: Sparkles,
  },
  {
    title: "Image generation",
    body: "Routes through provider adapters with manifests + receipts.",
    icon: Wand2,
  },
  {
    title: "Upscale",
    body: "Repair loops stay linear — queue runner owns retries.",
    icon: Boxes,
  },
  {
    title: "Image to video",
    body: "Honest adapters only — each hop emits another receipt.",
    icon: GitBranch,
  },
  {
    title: "Receipt",
    body: "Terminal proof node — exports JSON with IO + spend posture.",
    icon: Receipt,
  },
];

export default function StudioWorkflowsPage() {
  return (
    <div className="mx-auto max-w-6xl px-8 py-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
          Workflows
        </p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight md:text-5xl">
          Orchestration overview
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-relaxed text-ink-muted">
          Workflow graph execution arrives after adapters stabilize. Until then,
          this board explains how nodes will behave — each provider interaction is
          manifest-driven, receipt-backed, and explicit about identity.
        </p>
      </div>

      <Card className="mt-10 border-line-strong bg-panel-elevated/80 shadow-glow">
        <CardHeader>
          <CardTitle>Workflow graph coming next</CardTitle>
          <CardDescription>
            DAG authoring stays offline-first. Remote automation always surfaces
            provider + credential refs — never silent hops.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {nodes.map((n) => {
            const Icon = n.icon;
            return (
              <div
                key={n.title}
                className="rounded-2xl border border-line bg-panel px-5 py-4"
              >
                <Icon className="h-5 w-5 text-accent-cyan" />
                <div className="mt-3 text-sm font-semibold">{n.title}</div>
                <p className="mt-2 text-xs leading-relaxed text-ink-muted">
                  {n.body}
                </p>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="mt-10 grid gap-6 lg:grid-cols-2">
        <Card className="border-line bg-panel">
          <CardHeader>
            <CardTitle>Provider adapters</CardTitle>
            <CardDescription>
              Each edge resolves through registry adapters — swap mock for local
              or BYOK lanes without rewriting creative logic.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            <Badge variant="cyan">Manifest-driven</Badge>
            <Badge variant="muted">Execution tickets</Badge>
            <Badge variant="lime">Receipt every hop</Badge>
          </CardContent>
        </Card>
        <Card className="border-line bg-panel">
          <CardHeader>
            <CardTitle>Honest compute</CardTitle>
            <CardDescription>
              No fake runnable remote graphs in MVP — only Mock Provider proves
              the pipeline end-to-end today.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="accent" asChild className="gap-2">
              <Link href="/studio/image">
                Run mock proof path
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
