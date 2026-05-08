export type StoryboardShot = {
  id: string;
  title: string;
  description: string;
  durationSec: number;
  visualPrompt: string;
  referenceHandles: string[];
  /** Manifest task id or free text for planning */
  targetTask: string;
};

export type SavedPrompt = {
  id: string;
  title: string;
  body: string;
  /** Asset-map handles this note should stay coherent with */
  linkedHandles?: string[];
  createdAt: string;
};
