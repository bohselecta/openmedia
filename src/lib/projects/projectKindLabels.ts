import type { ProjectKind } from "@/lib/projects/projectTypes";

export const PROJECT_KIND_OPTIONS: { value: ProjectKind; label: string }[] = [
  { value: "image-set", label: "Image set" },
  { value: "video-piece", label: "Video piece" },
  { value: "music-video", label: "Music video" },
  { value: "lipsync", label: "Lip sync" },
  { value: "social-campaign", label: "Social campaign" },
  { value: "workflow-experiment", label: "Workflow experiment" },
];

export function formatProjectKind(k: ProjectKind): string {
  return PROJECT_KIND_OPTIONS.find((o) => o.value === k)?.label ?? k;
}
