import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export interface TextareaProps
  extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export function Textarea({ className, invalid, ...props }: TextareaProps) {
  return (
    <textarea
      aria-invalid={invalid || undefined}
      className={cn(
        "w-full rounded-lg border bg-white px-3.5 py-2.5 text-sm text-ink-900 transition-colors",
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
