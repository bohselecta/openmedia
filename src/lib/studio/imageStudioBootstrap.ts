const KEY = "omf:imageStudioBootstrap";

export type ImageStudioBootstrapPayload = {
  prompt?: string;
  projectId?: string;
  referenceHandles?: string[];
};

export function queueImageStudioBootstrap(payload: ImageStudioBootstrapPayload) {
  if (typeof sessionStorage === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(payload));
}

export function consumeImageStudioBootstrap(): ImageStudioBootstrapPayload | null {
  if (typeof sessionStorage === "undefined") return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  sessionStorage.removeItem(KEY);
  try {
    return JSON.parse(raw) as ImageStudioBootstrapPayload;
  } catch {
    return null;
  }
}
