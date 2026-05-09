"use client";

export function isDesktopRuntime(): boolean {
  return (
    typeof window !== "undefined" &&
    Boolean(window.omfDesktop?.enabled)
  );
}
