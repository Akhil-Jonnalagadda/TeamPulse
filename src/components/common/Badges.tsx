import { cn } from "@/lib/utils";
import { titleCase } from "@/lib/format";
import { SEVERITY_LABEL } from "@/lib/constants";

export function SeverityBadge({ severity, className }: { severity: string; className?: string }) {
  const map: Record<string, string> = {
    P1: "bg-sev-p1/12 text-sev-p1 ring-sev-p1/25",
    P2: "bg-sev-p2/14 text-sev-p2 ring-sev-p2/25",
    P3: "bg-sev-p3/16 text-sev-p3 ring-sev-p3/30",
    P4: "bg-sev-p4/12 text-sev-p4 ring-sev-p4/25",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-semibold ring-1 ring-inset",
        map[severity] ?? map["P4"],
        className,
      )}
      title={SEVERITY_LABEL[severity] ?? severity}
    >
      {severity}
    </span>
  );
}

const TONES: Record<string, string> = {
  positive: "bg-success/12 text-success ring-success/25",
  warning: "bg-warning/16 text-warning ring-warning/30",
  danger: "bg-destructive/12 text-destructive ring-destructive/25",
  info: "bg-info/12 text-info ring-info/25",
  neutral: "bg-muted text-muted-foreground ring-border",
};

export function StatusBadge({
  status,
  tone,
  className,
}: {
  status: string;
  tone?: keyof typeof TONES;
  className?: string;
}) {
  const inferred: keyof typeof TONES =
    tone ??
    (["completed", "resolved", "closed", "submitted", "reviewed", "active"].includes(status)
      ? "positive"
      : ["in_progress", "investigating", "monitoring", "draft", "started"].includes(status)
        ? "info"
        : ["blocked", "open", "critical", "missing", "needs_clarification"].includes(status)
          ? "danger"
          : ["pending", "needs_review", "late", "high"].includes(status)
            ? "warning"
            : "neutral");
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-md px-2 py-0.5 text-[11px] font-medium ring-1 ring-inset whitespace-nowrap",
        TONES[inferred],
        className,
      )}
    >
      {titleCase(status)}
    </span>
  );
}

export function PriorityBadge({ priority }: { priority: string }) {
  const tone =
    priority === "critical"
      ? "danger"
      : priority === "high"
        ? "warning"
        : priority === "medium"
          ? "info"
          : "neutral";
  return <StatusBadge status={priority} tone={tone as keyof typeof TONES} />;
}
