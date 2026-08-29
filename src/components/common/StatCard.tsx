import type { LucideIcon } from "lucide-react";
import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  hint?: string;
  delta?: number | null;
  tone?: "default" | "danger" | "warning" | "success";
  loading?: boolean;
  onClick?: () => void;
}

const TONE_RING: Record<string, string> = {
  default: "text-primary bg-primary/10",
  danger: "text-destructive bg-destructive/10",
  warning: "text-warning bg-warning/14",
  success: "text-success bg-success/12",
};

export function StatCard({
  label,
  value,
  icon: Icon,
  hint,
  delta,
  tone = "default",
  loading,
  onClick,
}: StatCardProps) {
  const Comp = onClick ? "button" : "div";
  return (
    <Comp
      onClick={onClick}
      className={cn(
        "surface group relative overflow-hidden p-4 text-left transition-all duration-200",
        onClick && "hover:border-primary/40 hover:shadow-pop focus-visible:ring-ring cursor-pointer focus-visible:ring-2 focus-visible:outline-none",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <p className="text-muted-foreground text-xs font-medium tracking-wide uppercase">{label}</p>
        <span className={cn("rounded-lg p-1.5 transition-transform group-hover:scale-110", TONE_RING[tone])}>
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      {loading ? (
        <Skeleton className="mt-3 h-8 w-20" />
      ) : (
        <p className="tabular mt-2 text-3xl font-semibold">{value}</p>
      )}
      <div className="text-muted-foreground mt-1.5 flex items-center gap-1.5 text-xs">
        {typeof delta === "number" && (
          <span
            className={cn(
              "inline-flex items-center gap-0.5 font-medium",
              delta > 0 ? "text-success" : delta < 0 ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {delta > 0 ? (
              <ArrowUpRight className="h-3 w-3" />
            ) : delta < 0 ? (
              <ArrowDownRight className="h-3 w-3" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            {Math.abs(delta)}%
          </span>
        )}
        {hint && <span className="truncate">{hint}</span>}
      </div>
    </Comp>
  );
}
