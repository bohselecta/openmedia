import type { Project } from "@/lib/projects/projectTypes";
import {
  migrateProjectRecord,
  type StoredProject,
} from "@/lib/projects/projectMigration";
import { create } from "zustand";
import { storageProjects } from "@/lib/storage/storage";

function newId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `proj-${Date.now()}`;
}

function seedProject(): Project {
  const now = new Date().toISOString();
  return {
    id: newId(),
    title: "Untitled project",
    description: "Local-first demo project",
    projectKind: "workflow-experiment",
    platformTarget: "other",
    createdAt: now,
    updatedAt: now,
  };
}

type ProjectState = {
  projects: Project[];
  currentProjectId: string | null;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
  upsertProject: (p: Project) => void;
  touchProject: (id: string) => void;
  setCurrentProjectId: (id: string | null) => void;
  ensureDefaultProject: () => Project;
};

export const useProjectStore = create<ProjectState>((set, get) => ({
  projects: [],
  currentProjectId: null,
  hydrated: false,
  hydrate: async () => {
    const raw =
      (await storageProjects.getItem<StoredProject[]>("projects")) ?? [];
    const projects = raw.map((p) => migrateProjectRecord(p));
    const currentProjectId =
      (await storageProjects.getItem<string | null>("currentProjectId")) ??
      null;
    set({ projects, currentProjectId, hydrated: true });
    if (projects.length === 0) {
      get().ensureDefaultProject();
    }
  },
  persist: async () => {
    await storageProjects.setItem("projects", get().projects);
    await storageProjects.setItem("currentProjectId", get().currentProjectId);
  },
  upsertProject: (p) => {
    set((s) => ({
      projects: [...s.projects.filter((x) => x.id !== p.id), p],
    }));
    void get().persist();
  },
  touchProject: (id) => {
    const now = new Date().toISOString();
    set((s) => ({
      projects: s.projects.map((p) =>
        p.id === id ? { ...p, updatedAt: now } : p,
      ),
    }));
    void get().persist();
  },
  setCurrentProjectId: (id) => {
    set({ currentProjectId: id });
    void get().persist();
  },
  ensureDefaultProject: () => {
    const p = seedProject();
    set((s) => ({
      projects: [...s.projects, p],
      currentProjectId: p.id,
    }));
    void get().persist();
    return p;
  },
}));
