import type { ReactNode } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { titleCase } from "@/lib/format";

export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="surface flex flex-wrap items-center gap-2 p-3">{children}</div>
  );
}

export function SearchInput({
  value,
  onChange,
  placeholder = "Search…",
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <div className="relative min-w-[200px] flex-1">
      <Search className="text-muted-foreground pointer-events-none absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-8"
        aria-label={placeholder}
      />
    </div>
  );
}

export function FilterSelect({
  value,
  onChange,
  options,
  allLabel,
  width = "w-[160px]",
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  allLabel: string;
  width?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={width} aria-label={allLabel}>
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {titleCase(o)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function OptionSelect({
  value,
  onChange,
  options,
  allLabel,
  width = "w-[180px]",
}: {
  value: string;
  onChange: (v: string) => void;
  options: { id: string; name: string }[];
  allLabel: string;
  width?: string;
}) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className={width} aria-label={allLabel}>
        <SelectValue placeholder={allLabel} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{allLabel}</SelectItem>
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id}>
            {o.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function RangeSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const options = [
    { id: "7", label: "Last 7 days" },
    { id: "14", label: "Last 14 days" },
    { id: "30", label: "Last 30 days" },
    { id: "90", label: "Last 90 days" },
  ];
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-[150px]" aria-label="Date range">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o.id} value={o.id}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
