import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

export function Spinner({ className }: { className?: string }) {
  return (
    <Loader2
      className={cn("size-5 animate-spin text-bronze-600", className)}
      aria-label="Memuat"
    />
  );
}

export function PageLoader({ label = "Memuat..." }: { label?: string }) {
  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-ink-400">
      <Spinner />
      <p className="text-sm">{label}</p>
    </div>
  );
}
