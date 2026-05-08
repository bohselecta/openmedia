import Link from "next/link";
import {
  Clapperboard,
  ImageIcon,
  Mic,
  Pencil,
  Workflow,
} from "lucide-react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { StudioDashboard } from "@/components/studio/StudioDashboard";

const hubs = [
  {
    href: "/studio/image",
    title: "Image",
    desc: "Text-to-image with receipts · MVP complete path.",
    icon: ImageIcon,
    tone: "from-accent-cyan/15 to-transparent",
  },
  {
    href: "/studio/video",
    title: "Video",
    desc: "Honest placeholder — no hosted video compute in MVP.",
    icon: Clapperboard,
    tone: "from-accent-amber/12 to-transparent",
  },
  {
    href: "/studio/edit",
    title: "Edit",
    desc: "Repair loops land here later.",
    icon: Pencil,
    tone: "from-accent-violet/12 to-transparent",
  },
  {
    href: "/studio/lipsync",
    title: "Lipsync",
    desc: "Placeholder route — adapters required.",
    icon: Mic,
    tone: "from-accent-rose/12 to-transparent",
  },
  {
    href: "/studio/storyboard",
    title: "Storyboard",
    desc: "Shot planning · export-ready deck.",
    icon: Clapperboard,
    tone: "from-accent-lime/10 to-transparent",
  },
  {
    href: "/studio/workflows",
    title: "Workflows",
    desc: "Orchestration graph · receipts-first.",
    icon: Workflow,
    tone: "from-white/8 to-transparent",
  },
];

export default function StudioIndexPage() {
  return (
    <div className="flex flex-col">
      <StudioDashboard />
      <div className="mx-auto max-w-6xl px-8 pb-14">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-ink-faint">
            Disciplines
          </p>
          <h2 className="mt-3 text-2xl font-semibold tracking-tight">
            Jump into a lane
          </h2>
          <p className="mt-4 text-sm leading-relaxed text-ink-muted">
            Image Studio is fully wired on Mock Provider. Other lanes stay honest
            until adapters ship — no fake remote execution.
          </p>
        </div>
        <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {hubs.map((hub) => {
            const Icon = hub.icon;
            return (
              <Link key={hub.href} href={hub.href} className="group block">
                <Card className="h-full border-line bg-panel-elevated/70 transition-all hover:border-line-strong hover:shadow-glow">
                  <CardHeader>
                    <div
                      className={`mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br ${hub.tone} ring-1 ring-line`}
                    >
                      <Icon className="h-5 w-5 text-ink" />
                    </div>
                    <CardTitle className="text-xl">{hub.title}</CardTitle>
                    <CardDescription>{hub.desc}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
