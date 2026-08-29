import { format, formatDistanceToNowStrict, isToday, parseISO } from "date-fns";

export function isoDate(d: Date = new Date()): string {
  return format(d, "yyyy-MM-dd");
}

export function daysAgoIso(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return isoDate(d);
}

export function prettyDate(value: string | Date): string {
  const d = typeof value === "string" ? parseISO(value) : value;
  return format(d, "EEEE, d MMMM yyyy");
}

export function shortDate(value: string | Date): string {
  const d = typeof value === "string" ? parseISO(value) : value;
  return format(d, "d MMM");
}

export function clockTime(value: string | Date): string {
  const d = typeof value === "string" ? new Date(value) : value;
  return format(d, "h:mm:ss a");
}

export function timeAgo(value: string | Date | null | undefined): string {
  if (!value) return "—";
  const d = typeof value === "string" ? new Date(value) : value;
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "just now";
  return `${formatDistanceToNowStrict(d)} ago`;
}

export function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function hours(value: number | null | undefined): string {
  return `${Number(value ?? 0).toFixed(1)}h`;
}

export function titleCase(value: string): string {
  return value.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function isTodayIso(value: string): boolean {
  return isToday(parseISO(value));
}

export function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]!);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
}

export function downloadCsv(filename: string, rows: Record<string, unknown>[]): void {
  const csv = toCsv(rows);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
