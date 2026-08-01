import type { LucideIcon } from "lucide-react";
import { Inbox } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-line-dark px-6 py-12 text-center",
        className
      )}
    >
      <span className="flex size-12 items-center justify-center rounded-full bg-cream-100 text-ink-400">
        <Icon size={22} />
      </span>
      <h3 className="mt-1 font-medium text-ink-900">{title}</h3>
      {description && <p className="max-w-sm text-sm text-ink-600">{description}</p>}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}
