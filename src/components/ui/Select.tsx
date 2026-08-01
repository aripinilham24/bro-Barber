import type { SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export function Select({ className, invalid, children, ...props }: SelectProps) {
  return (
    <div className="relative">
      <select
        aria-invalid={invalid || undefined}
        className={cn(
          "h-11 w-full appearance-none rounded-lg border bg-white px-3.5 pr-9 text-sm text-ink-900 transition-colors",
          "focus:outline-none focus:ring-2",
          invalid
            ? "border-danger-600 focus:border-danger-600 focus:ring-danger-100"
            : "border-line-dark hover:border-ink-200 focus:border-bronze-500 focus:ring-bronze-100",
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-ink-400"
      />
    </div>
  );
}
