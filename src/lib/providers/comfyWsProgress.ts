/**
 * Optional ComfyUI WebSocket listener — progress UI may subscribe later.
 * Endpoint shape follows Comfy: ws(s)://host/ws?clientId=
 */
export function subscribeComfyWs(
  baseUrl: string,
  clientId: string,
  onActivity: (preview: string) => void,
): () => void {
  try {
    const root = new URL(baseUrl.replace(/\/+$/, ""));
    const wsScheme = root.protocol === "https:" ? "wss:" : "ws:";
    const qs = new URLSearchParams({ clientId });
    const wsUrl = `${wsScheme}//${root.host}/ws?${qs.toString()}`;
    const ws = new WebSocket(wsUrl);
    ws.onmessage = (ev) => {
      let t = String(ev.data ?? "");
      if (t.length > 200) t = `${t.slice(0, 200)}…`;
      onActivity(t);
    };
    ws.onerror = () => onActivity("(websocket error)");
    return () => {
      try {
        ws.close();
      } catch {
        /* noop */
      }
    };
  } catch {
    return () => {};
  }
}
