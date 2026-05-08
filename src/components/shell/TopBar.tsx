"use client";

import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useJobStore } from "@/lib/jobs/jobStore";
import { useProjectStore } from "@/lib/projects/projectStore";

export function TopBar() {
  const projects = useProjectStore((s) => s.projects);
  const currentId = useProjectStore((s) => s.currentProjectId);
  const setCurrent = useProjectStore((s) => s.setCurrentProjectId);
  const jobs = useJobStore((s) => s.jobs);
  const active = jobs.filter(
    (j) => j.status === "queued" || j.status === "running",
  ).length;

  const current = projects.find((p) => p.id === currentId) ?? projects[0];

  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-line bg-panel/90 px-6 backdrop-blur-md">
      <div className="flex items-center gap-4">
        <div className="text-xs font-semibold uppercase tracking-wide text-ink-faint">
          Project
        </div>
        <Select
          value={current?.id ?? ""}
          onValueChange={(v) => setCurrent(v)}
        >
          <SelectTrigger className="h-9 w-[220px] border-line bg-panel-elevated text-left text-sm">
            <SelectValue placeholder="Choose project" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.title}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="flex items-center gap-3">
        <Badge
          variant="cyan"
          className="font-normal normal-case tracking-normal"
        >
          Active jobs: {active}
        </Badge>
        <Separator orientation="vertical" className="h-6 bg-line" />
        <Link
          href="/queue"
          className="text-xs font-semibold uppercase tracking-wide text-ink-muted hover:text-ink"
        >
          Queue
        </Link>
        <Link
          href="/keys"
          className="text-xs font-semibold uppercase tracking-wide text-ink-muted hover:text-ink"
        >
          KeyRail
        </Link>
      </div>
    </header>
  );
}
