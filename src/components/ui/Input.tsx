import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ className, invalid, ...props }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        "h-11 w-full rounded-lg border bg-white px-3.5 text-sm text-ink-900 transition-colors",
        "placeholder:text-ink-400 focus:outline-none focus:ring-2",
        invalid
          ? "border-danger-600 focus:border-danger-600 focus:ring-danger-100"
          : "border-line-dark hover:border-ink-200 focus:border-bronze-500 focus:ring-bronze-100",
        className
      )}
      {...props}
    />
  );
}
