"use client";

import type { ElementType } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Boxes,
  FolderKanban,
  ImageIcon,
  KeyRound,
  LayoutDashboard,
  Layers,
  Receipt,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items: { href: string; label: string; icon: ElementType }[] = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/studio", label: "Studio", icon: Sparkles },
  { href: "/projects", label: "Projects", icon: FolderKanban },
  { href: "/assets", label: "Assets", icon: ImageIcon },
  { href: "/queue", label: "Queue", icon: Layers },
  { href: "/receipts", label: "Receipts", icon: Receipt },
  { href: "/providers", label: "Providers", icon: Boxes },
  { href: "/keys", label: "Keys", icon: KeyRound },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function LeftRail() {
  const pathname = usePathname();

  return (
    <aside className="flex w-[240px] shrink-0 flex-col border-r border-line bg-panel">
      <div className="flex items-center gap-2 px-5 py-6">
        <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-accent-cyan/25 to-accent-lime/25 ring-1 ring-line-strong" />
        <div>
          <div className="text-sm font-semibold tracking-tight text-ink">
            OpenMediaForge
          </div>
          <div className="text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
            Command desk
          </div>
        </div>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 px-3 pb-6">
        {items.map((item) => {
          const active =
            item.href === "/"
              ? pathname === "/"
              : pathname === item.href || pathname.startsWith(`${item.href}/`);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-panel-elevated text-ink shadow-glow ring-1 ring-line"
                  : "text-ink-muted hover:bg-white/5 hover:text-ink",
              )}
            >
              <Icon className="h-4 w-4 shrink-0 opacity-90" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-line px-5 py-4 text-[11px] leading-relaxed text-ink-faint">
        Local-first. Provider-neutral. Mock compute ships with MVP.
      </div>
    </aside>
  );
}
