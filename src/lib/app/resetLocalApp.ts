import { clearAllOmfStores } from "@/lib/storage/storage";

export async function hardResetLocalApp(): Promise<void> {
  await clearAllOmfStores();
  if (typeof window !== "undefined") {
    window.location.reload();
  }
}
