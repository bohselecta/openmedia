export type ComfyFetch = typeof fetch;

function joinUrl(base: string, path: string) {
  const b = base.replace(/\/+$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}

export async function fetchComfySystemStats(
  baseUrl: string,
  timeoutMs: number,
  fetchImpl: ComfyFetch = fetch,
): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(joinUrl(baseUrl, "/system_stats"), {
      signal: ctrl.signal,
    });
    if (!res.ok) {
      throw new Error(`system_stats HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export async function fetchComfyObjectInfo(
  baseUrl: string,
  timeoutMs: number,
  fetchImpl: ComfyFetch = fetch,
): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(joinUrl(baseUrl, "/object_info"), {
      signal: ctrl.signal,
    });
    if (!res.ok) {
      throw new Error(`object_info HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export async function fetchComfyQueue(
  baseUrl: string,
  timeoutMs: number,
  fetchImpl: ComfyFetch = fetch,
): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(joinUrl(baseUrl, "/queue"), {
      signal: ctrl.signal,
    });
    if (!res.ok) {
      throw new Error(`queue HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export async function postComfyPrompt(
  baseUrl: string,
  body: { prompt: unknown; client_id: string },
  timeoutMs: number,
  fetchImpl: ComfyFetch = fetch,
): Promise<{ prompt_id?: string; error?: unknown; node_errors?: unknown }> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(joinUrl(baseUrl, "/prompt"), {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    const json = (await res.json()) as {
      prompt_id?: string;
      error?: unknown;
      node_errors?: unknown;
    };
    if (!res.ok) {
      const msg =
        typeof json.error === "string" ? json.error : `prompt HTTP ${res.status}`;
      throw new Error(msg);
    }
    return json;
  } finally {
    clearTimeout(t);
  }
}

export async function fetchComfyHistory(
  baseUrl: string,
  promptId: string,
  timeoutMs: number,
  fetchImpl: ComfyFetch = fetch,
): Promise<unknown> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(joinUrl(baseUrl, `/history/${promptId}`), {
      signal: ctrl.signal,
    });
    if (!res.ok) {
      throw new Error(`history HTTP ${res.status}`);
    }
    return await res.json();
  } finally {
    clearTimeout(t);
  }
}

export async function postComfyInterrupt(
  baseUrl: string,
  timeoutMs: number,
  fetchImpl: ComfyFetch = fetch,
): Promise<void> {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    await fetchImpl(joinUrl(baseUrl, "/interrupt"), {
      method: "POST",
      signal: ctrl.signal,
    });
  } finally {
    clearTimeout(t);
  }
}

export function comfyViewUrl(
  baseUrl: string,
  filename: string,
  subfolder: string,
  type: string,
): string {
  const u = new URL(joinUrl(baseUrl, "/view"));
  u.searchParams.set("filename", filename);
  u.searchParams.set("subfolder", subfolder);
  u.searchParams.set("type", type);
  return u.toString();
}

export async function uploadComfyImage(
  baseUrl: string,
  blob: Blob,
  filename: string,
  timeoutMs: number,
  fetchImpl: ComfyFetch = fetch,
): Promise<{ name?: string }> {
  const form = new FormData();
  form.append("image", blob, filename);
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetchImpl(joinUrl(baseUrl, "/upload/image"), {
      method: "POST",
      body: form,
      signal: ctrl.signal,
    });
    if (!res.ok) {
      throw new Error(`upload/image HTTP ${res.status}`);
    }
    return (await res.json()) as { name?: string };
  } finally {
    clearTimeout(t);
  }
}
