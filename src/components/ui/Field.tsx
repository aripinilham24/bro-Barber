import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface FieldProps {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children: ReactNode;
}

/** Pembungkus form: label + kontrol + hint/error */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  className,
  children,
}: FieldProps) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      {label && (
        <label
          htmlFor={htmlFor}
          className="text-sm font-medium text-ink-700"
        >
          {label}
          {required && <span className="ml-0.5 text-bronze-600">*</span>}
        </label>
      )}
      {children}
      {hint && !error && (
        <p className="text-xs text-ink-400" id={htmlFor ? `${htmlFor}-hint` : undefined}>
          {hint}
        </p>
      )}
      {error && (
        <p className="text-xs text-danger-600">{error}</p>
      )}
    </div>
  );
}
