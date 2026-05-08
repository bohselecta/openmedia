import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide transition-colors",
  {
    variants: {
      variant: {
        default:
          "border-line bg-panel-elevated text-ink-muted hover:border-line-strong",
        lime: "border-accent-lime/40 bg-accent-lime/10 text-accent-lime",
        cyan: "border-accent-cyan/40 bg-accent-cyan/10 text-accent-cyan",
        amber: "border-accent-amber/40 bg-accent-amber/10 text-accent-amber",
        muted: "border-transparent bg-white/5 text-ink-faint",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
