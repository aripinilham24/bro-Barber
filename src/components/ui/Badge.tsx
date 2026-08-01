import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Tone = "ok" | "warn" | "danger" | "info" | "neutral" | "bronze";

const tones: Record<Tone, string> = {
  ok: "bg-ok-100 text-ok-800",
  warn: "bg-warn-100 text-warn-800",
  danger: "bg-danger-100 text-danger-800",
  info: "bg-info-100 text-info-800",
  neutral: "bg-cream-100 text-ink-600",
  bronze: "bg-bronze-100 text-bronze-700",
};

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  tone?: Tone;
  dot?: boolean;
}

export function Badge({ tone = "neutral", dot = false, className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className
      )}
      {...props}
    >
      {dot && (
        <span
          aria-hidden
          className={cn(
            "size-1.5 rounded-full",
            tone === "ok" && "bg-ok-600",
            tone === "warn" && "bg-warn-600",
            tone === "danger" && "bg-danger-600",
            tone === "info" && "bg-info-600",
            tone === "neutral" && "bg-ink-400",
            tone === "bronze" && "bg-bronze-500"
          )}
        />
      )}
      {children}
    </span>
  );
}
