import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { initials } from "@/lib/format";

const PALETTE = [
  "bg-chart-1/15 text-chart-1",
  "bg-chart-2/15 text-chart-2",
  "bg-chart-3/20 text-chart-3",
  "bg-chart-4/15 text-chart-4",
  "bg-chart-5/15 text-chart-5",
];

function hashIndex(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i += 1) h = (h * 31 + seed.charCodeAt(i)) % 997;
  return h % PALETTE.length;
}

export function UserAvatar({
  name,
  src,
  size = "md",
  presence,
  className,
}: {
  name: string;
  src?: string | null;
  size?: "sm" | "md" | "lg";
  presence?: "online" | "away" | "offline";
  className?: string;
}) {
  const dims = size === "sm" ? "h-7 w-7 text-[10px]" : size === "lg" ? "h-14 w-14 text-lg" : "h-9 w-9 text-xs";
  return (
    <span className={cn("relative inline-flex shrink-0", className)}>
      <Avatar className={dims}>
        {src ? <AvatarImage src={src} alt={name} /> : null}
        <AvatarFallback className={cn("font-semibold", PALETTE[hashIndex(name)])}>
          {initials(name)}
        </AvatarFallback>
      </Avatar>
      {presence && (
        <span
          aria-label={`${name} is ${presence}`}
          className={cn(
            "border-card absolute -right-0.5 -bottom-0.5 h-3 w-3 rounded-full border-2 transition-colors",
            presence === "online"
              ? "bg-success"
              : presence === "away"
                ? "bg-warning"
                : "bg-muted-foreground/40",
          )}
        />
      )}
    </span>
  );
}
