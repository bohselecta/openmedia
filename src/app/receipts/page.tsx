import { Suspense } from "react";
import { ReceiptsBoard } from "@/components/receipts/ReceiptsBoard";

export default function ReceiptsPage() {
  return (
    <Suspense
      fallback={
        <div className="px-8 py-12 text-sm text-ink-muted">Loading receipts…</div>
      }
    >
      <ReceiptsBoard />
    </Suspense>
  );
}
