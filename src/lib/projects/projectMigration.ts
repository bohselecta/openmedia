import type {
  LegacyProjectMode,
  Project,
  ProjectKind,
} from "@contracts/data-model.contract";

export function legacyModeToKind(mode: LegacyProjectMode): ProjectKind {
  switch (mode) {
    case "image":
      return "image-set";
    case "video":
      return "video-piece";
    case "music-video":
      return "music-video";
    case "lipsync":
      return "lipsync";
    case "storyboard":
      return "workflow-experiment";
    case "workflow":
      return "workflow-experiment";
    case "mixed":
    default:
      return "workflow-experiment";
  }
}

export type StoredProject = Partial<Project> & {
  id: string;
  mode?: LegacyProjectMode;
};

export function migrateProjectRecord(p: StoredProject): Project {
  const now = new Date().toISOString();
  const projectKind: ProjectKind =
    p.projectKind ??
    (p.mode ? legacyModeToKind(p.mode) : "workflow-experiment");
  return {
    id: p.id,
    title: p.title ?? "Untitled project",
    description: p.description,
    projectKind,
    mode: p.mode,
    platformTarget: p.platformTarget ?? "other",
    createdAt: p.createdAt ?? now,
    updatedAt: p.updatedAt ?? now,
  };
}
