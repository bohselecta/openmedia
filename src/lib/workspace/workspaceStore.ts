import type { SavedPrompt, StoryboardShot } from "@/lib/workspace/workspaceTypes";
import { create } from "zustand";
import { storageWorkspace } from "@/lib/storage/storage";

type WorkspaceBundle = {
  storyboardByProject: Record<string, StoryboardShot[]>;
  promptsByProject: Record<string, SavedPrompt[]>;
};

type WorkspaceState = WorkspaceBundle & {
  hydrated: boolean;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
  setStoryboardShots: (projectId: string, shots: StoryboardShot[]) => void;
  upsertPrompt: (projectId: string, prompt: SavedPrompt) => void;
};

const EMPTY: WorkspaceBundle = {
  storyboardByProject: {},
  promptsByProject: {},
};

export const useWorkspaceStore = create<WorkspaceState>((set, get) => ({
  ...EMPTY,
  hydrated: false,
  hydrate: async () => {
    const bundle =
      (await storageWorkspace.getItem<WorkspaceBundle>("bundle")) ?? EMPTY;
    set({
      storyboardByProject: bundle.storyboardByProject ?? {},
      promptsByProject: bundle.promptsByProject ?? {},
      hydrated: true,
    });
  },
  persist: async () => {
    const { storyboardByProject, promptsByProject } = get();
    await storageWorkspace.setItem("bundle", {
      storyboardByProject,
      promptsByProject,
    });
  },
  setStoryboardShots: (projectId, shots) => {
    set((s) => ({
      storyboardByProject: { ...s.storyboardByProject, [projectId]: shots },
    }));
    void get().persist();
  },
  upsertPrompt: (projectId, prompt) => {
    set((s) => {
      const prev = s.promptsByProject[projectId] ?? [];
      const next = [...prev.filter((p) => p.id !== prompt.id), prompt];
      return {
        promptsByProject: { ...s.promptsByProject, [projectId]: next },
      };
    });
    void get().persist();
  },
}));
