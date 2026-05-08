"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useParams } from "next/navigation";
import { ProjectWorkspace } from "@/components/project/ProjectWorkspace";
import { Button } from "@/components/ui/button";
import { useProjectStore } from "@/lib/projects/projectStore";

export default function ProjectDetailPage() {
  const params = useParams();
  const id = String(params.id);
  const project = useProjectStore((s) => s.projects.find((p) => p.id === id));
  const setCurrent = useProjectStore((s) => s.setCurrentProjectId);

  useEffect(() => {
    setCurrent(id);
  }, [id, setCurrent]);

  if (!project) {
    return (
      <div className="mx-auto max-w-xl px-8 py-20 text-center">
        <h1 className="text-2xl font-semibold">Project not found</h1>
        <p className="mt-3 text-sm text-ink-muted">
          It may have been reset locally — create a new production container.
        </p>
        <Button className="mt-8" variant="accent" asChild>
          <Link href="/projects">Back to projects</Link>
        </Button>
      </div>
    );
  }

  return <ProjectWorkspace project={project} />;
}
