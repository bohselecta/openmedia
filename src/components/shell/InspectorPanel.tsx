"use client";

import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function InspectorPanel({
  className,
  children,
}: {
  className?: string;
  children: ReactNode;
}) {
  return (
    <aside
      className={cn(
        "hidden w-[320px] shrink-0 border-l border-line bg-panel/95 p-5 xl:block",
        className,
      )}
    >
      <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        Inspector
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </aside>
  );
}
