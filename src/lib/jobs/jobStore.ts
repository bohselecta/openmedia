import type { GenerationJob } from "@/lib/jobs/jobTypes";
import { create } from "zustand";
import { storageJobs } from "@/lib/storage/storage";

type JobState = {
  jobs: GenerationJob[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  persist: () => Promise<void>;
  upsertJob: (j: GenerationJob) => void;
};

export const useJobStore = create<JobState>((set, get) => ({
  jobs: [],
  hydrated: false,
  hydrate: async () => {
    const jobs = (await storageJobs.getItem<GenerationJob[]>("jobs")) ?? [];
    set({
      jobs: jobs.map((j) => ({
        ...j,
        referenceSelections: j.referenceSelections ?? [],
      })),
      hydrated: true,
    });
  },
  persist: async () => {
    await storageJobs.setItem("jobs", get().jobs);
  },
  upsertJob: (j) => {
    set((s) => ({
      jobs: [...s.jobs.filter((x) => x.id !== j.id), j],
    }));
    void get().persist();
  },
}));
