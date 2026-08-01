import { Scissors } from "lucide-react";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  dark?: boolean;
  compact?: boolean;
}

export function Logo({ className, dark = false, compact = false }: LogoProps) {
  return (
    <span
      className={cn(
        "inline-flex select-none items-center gap-2.5",
        dark ? "text-cream-50" : "text-ink-900",
        className
      )}
    >
      <span
        className={cn(
          "flex items-center justify-center rounded-lg",
          dark ? "bg-cream-50 text-ink-900" : "bg-ink-900 text-cream-50"
        )}
      >
        <Scissors size={compact ? 14 : 18} className="m-1.5" strokeWidth={2.2} />
      </span>
      {!compact && (
        <span className="font-display text-xl font-bold tracking-tight">
          Bro Barber
        </span>
      )}
    </span>
  );
}
