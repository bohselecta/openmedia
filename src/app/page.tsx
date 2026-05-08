import Link from "next/link";
import {
  ArrowRight,
  Boxes,
  Layers,
  Receipt,
  Shield,
  Sparkles,
  Zap,
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

export default function HomePage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,rgba(125,215,255,0.14),transparent)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-20 px-8 py-16 md:py-24">
        <section className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div>
            <Badge
              variant="muted"
              className="mb-6 border-line-strong bg-panel-elevated/80 font-normal normal-case tracking-normal text-ink-muted"
            >
              Local-first · Provider-neutral · Receipt-backed
            </Badge>
            <h1 className="text-5xl font-semibold tracking-tight text-ink md:text-6xl lg:text-7xl">
              OpenMediaForge
            </h1>
            <p className="mt-6 max-w-xl text-lg font-medium leading-relaxed text-ink md:text-xl">
              A creator-owned command desk for AI media.
            </p>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-ink-muted md:text-base">
              Plan, generate, repair, track, and prove image/video work across
              local engines and bring-your-own providers.
            </p>
            <div className="mt-10 flex flex-wrap gap-4">
              <Button variant="accent" size="lg" asChild className="gap-2 px-8">
                <Link href="/studio">
                  Enter Studio
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link href="/receipts">View Receipts Demo</Link>
              </Button>
            </div>
            <p className="mt-8 max-w-lg text-xs leading-relaxed text-ink-faint">
              Mock compute is the safe demo lane — no API keys, no hidden remote
              calls. Real engines plug in later through honest provider adapters.
            </p>
          </div>

          <div className="relative">
            <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-accent-cyan/10 via-transparent to-accent-lime/10 blur-2xl" />
            <Card className="relative border-line-strong bg-panel-elevated/85 shadow-glow backdrop-blur-xl">
              <CardHeader className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.3em] text-ink-faint">
                    Live board
                  </span>
                  <Badge variant="lime" className="font-normal normal-case">
                    Mock lane active
                  </Badge>
                </div>
                <CardTitle className="text-xl">Project · Midnight Campaign</CardTitle>
                <CardDescription className="text-ink-muted">
                  Queue depth · receipts minted · provider trust surfaces.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 rounded-2xl border border-line bg-panel p-4">
                  <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-ink-faint">
                    <span>Queue</span>
                    <span className="text-accent-cyan">Running</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-black/50">
                    <div className="h-full w-[68%] rounded-full bg-gradient-to-r from-accent-cyan to-accent-lime" />
                  </div>
                  <div className="flex flex-wrap gap-2 text-[11px] text-ink-muted">
                    <Badge variant="cyan">mock · mock-image-v1</Badge>
                    <Badge variant="muted">text-to-image</Badge>
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-line bg-panel p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                      Receipt
                    </div>
                    <div className="mt-2 font-mono text-[11px] text-ink-muted">
                      rcp_01 · provenance locked
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Receipt className="h-4 w-4 text-accent-lime" />
                      <span className="text-xs text-ink-muted">
                        Credential ref only — never raw keys.
                      </span>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-line bg-panel p-4">
                    <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
                      Providers
                    </div>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <Badge variant="muted">Mock · connected</Badge>
                      <Badge variant="muted">BYOK · planned</Badge>
                      <Badge variant="muted">Local · planned</Badge>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section className="grid gap-6 md:grid-cols-3">
          <FeatureCard
            icon={Sparkles}
            title="Studio, not wrapper"
            body="A workstation layout built for prompts, references, queues, and receipts — not a toy chat shell."
          />
          <FeatureCard
            icon={Shield}
            title="Local-first by design"
            body="Indexed storage keeps projects, assets, jobs, and receipts on-device until you choose otherwise."
          />
          <FeatureCard
            icon={Boxes}
            title="Bring your own providers"
            body="Every compute source is an adapter behind manifests — swap mock, local, or BYOK without rewriting your desk."
          />
        </section>

        <section className="grid gap-6 md:grid-cols-2">
          <FeatureCard
            icon={Receipt}
            title="Every generation leaves a receipt"
            body="Prove prompts, models, provider identity, IO pointers, cost posture, and network destinations — without ever storing raw secrets."
          />
          <FeatureCard
            icon={Layers}
            title="Built for creators who work across tools"
            body="Asset maps, reference budgets, render queues, and provenance cards mirror how serious film and music pipelines actually run."
          />
        </section>

        <section className="rounded-[2rem] border border-line-strong bg-panel-elevated/70 px-8 py-12 text-center shadow-glow backdrop-blur">
          <div className="mx-auto flex max-w-2xl flex-col items-center gap-6">
            <Zap className="h-10 w-10 text-accent-lime" />
            <h2 className="text-3xl font-semibold tracking-tight md:text-4xl">
              Ready when you are.
            </h2>
            <p className="text-sm leading-relaxed text-ink-muted">
              Spin up a project, run the mock lane, and inspect the receipt trail — then connect real adapters when your pipeline is ready.
            </p>
            <Button variant="accent" size="lg" asChild className="gap-2">
              <Link href="/studio/image">
                Launch Image Studio
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Sparkles;
  title: string;
  body: string;
}) {
  return (
    <Card className="border-line bg-panel-elevated/70 backdrop-blur">
      <CardHeader>
        <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-white/5 ring-1 ring-line">
          <Icon className="h-5 w-5 text-accent-cyan" />
        </div>
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription className="text-sm leading-relaxed text-ink-muted">
          {body}
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
