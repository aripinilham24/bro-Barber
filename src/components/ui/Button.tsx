import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes } from "react";

type Variant = "primary" | "secondary" | "outline" | "ghost" | "danger";
type Size = "sm" | "md" | "lg";

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-ink-900 text-cream-50 hover:bg-ink-700 focus-visible:ring-bronze-200",
  secondary:
    "bg-bronze-500 text-white hover:bg-bronze-600 focus-visible:ring-bronze-200",
  outline:
    "border border-line-dark bg-white text-ink-900 hover:border-ink-400 hover:bg-cream-100 focus-visible:ring-bronze-100",
  ghost: "text-ink-700 hover:bg-cream-100 hover:text-ink-900 focus-visible:ring-bronze-100",
  danger:
    "bg-danger-600 text-white hover:bg-danger-800 focus-visible:ring-danger-100",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-9 px-3.5 text-sm gap-1.5",
  md: "h-11 px-5 text-sm gap-2",
  lg: "h-12 px-7 text-base gap-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled,
  className,
  children,
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(
        "inline-flex select-none items-center justify-center rounded-full font-medium transition-all duration-150",
        "focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && (
        <span
          aria-hidden
          className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
