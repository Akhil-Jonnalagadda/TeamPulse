import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { EmptyState } from "@/components/common/States";

const AXIS = {
  stroke: "var(--color-muted-foreground)",
  fontSize: 11,
  tickLine: false,
  axisLine: false,
} as const;

const TOOLTIP_STYLE = {
  contentStyle: {
    background: "var(--color-popover)",
    border: "1px solid var(--color-border)",
    borderRadius: "10px",
    fontSize: "12px",
    boxShadow: "var(--shadow-pop)",
    color: "var(--color-popover-foreground)",
  },
  labelStyle: { color: "var(--color-muted-foreground)", fontSize: 11 },
} as const;

export const CHART_COLORS = [
  "var(--color-chart-1)",
  "var(--color-chart-2)",
  "var(--color-chart-3)",
  "var(--color-chart-4)",
  "var(--color-chart-5)",
  "var(--color-sev-p2)",
  "var(--color-sev-p4)",
];

export const SEVERITY_COLORS: Record<string, string> = {
  P1: "var(--color-sev-p1)",
  P2: "var(--color-sev-p2)",
  P3: "var(--color-sev-p3)",
  P4: "var(--color-sev-p4)",
};

function Blank({ label }: { label: string }) {
  return <EmptyState title={label} description="Data will appear here as the team logs activity." />;
}

export function DonutChart({
  data,
  height = 260,
  colors,
  emptyLabel = "Nothing to chart yet",
}: {
  data: { name: string; value: number }[];
  height?: number;
  colors?: Record<string, string> | string[];
  emptyLabel?: string;
}) {
  if (data.every((d) => d.value === 0)) return <Blank label={emptyLabel} />;
  const colorFor = (name: string, i: number) =>
    Array.isArray(colors) ? colors[i % colors.length]! : (colors?.[name] ?? CHART_COLORS[i % CHART_COLORS.length]!);
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          dataKey="value"
          nameKey="name"
          innerRadius="58%"
          outerRadius="82%"
          paddingAngle={2}
          stroke="var(--color-card)"
          strokeWidth={2}
          animationDuration={700}
        >
          {data.map((d, i) => (
            <Cell key={d.name} fill={colorFor(d.name, i)} />
          ))}
        </Pie>
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend
          iconType="circle"
          iconSize={8}
          wrapperStyle={{ fontSize: 11, color: "var(--color-muted-foreground)" }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}

export function TrendLineChart({
  data,
  series,
  height = 260,
  xKey = "label",
}: {
  data: Record<string, unknown>[];
  series: { key: string; label: string; color?: string }[];
  height?: number;
  xKey?: string;
}) {
  if (data.length === 0) return <Blank label="No trend data yet" />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey={xKey} {...AXIS} />
        <YAxis allowDecimals={false} {...AXIS} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend iconType="plainline" wrapperStyle={{ fontSize: 11 }} />
        {series.map((s, i) => (
          <Line
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4 }}
            animationDuration={700}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}

export function StackedAreaChart({
  data,
  series,
  height = 260,
  xKey = "label",
}: {
  data: Record<string, unknown>[];
  series: { key: string; label: string; color?: string }[];
  height?: number;
  xKey?: string;
}) {
  if (data.length === 0) return <Blank label="No activity recorded yet" />;
  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 6, right: 8, left: -18, bottom: 0 }}>
        <defs>
          {series.map((s, i) => (
            <linearGradient key={s.key} id={`grad-${s.key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={s.color ?? CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.35} />
              <stop offset="100%" stopColor={s.color ?? CHART_COLORS[i % CHART_COLORS.length]} stopOpacity={0.02} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" vertical={false} />
        <XAxis dataKey={xKey} {...AXIS} />
        <YAxis allowDecimals={false} {...AXIS} />
        <Tooltip {...TOOLTIP_STYLE} />
        <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
        {series.map((s, i) => (
          <Area
            key={s.key}
            type="monotone"
            dataKey={s.key}
            name={s.label}
            stroke={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
            fill={`url(#grad-${s.key})`}
            strokeWidth={2}
            animationDuration={700}
          />
        ))}
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function BarsChart({
  data,
  series,
  height = 300,
  xKey = "label",
  layout = "vertical",
  stacked = false,
}: {
  data: Record<string, unknown>[];
  series: { key: string; label: string; color?: string }[];
  height?: number;
  xKey?: string;
  layout?: "vertical" | "horizontal";
  stacked?: boolean;
}) {
  if (data.length === 0) return <Blank label="No data to compare yet" />;
  const isHorizontalBars = layout === "vertical";
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={data}
        layout={isHorizontalBars ? "vertical" : "horizontal"}
        margin={{ top: 6, right: 12, left: isHorizontalBars ? 12 : -18, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" horizontal={!isHorizontalBars} vertical={isHorizontalBars} />
        {isHorizontalBars ? (
          <>
            <XAxis type="number" {...AXIS} />
            <YAxis type="category" dataKey={xKey} width={110} {...AXIS} />
          </>
        ) : (
          <>
            <XAxis dataKey={xKey} {...AXIS} />
            <YAxis {...AXIS} />
          </>
        )}
        <Tooltip {...TOOLTIP_STYLE} cursor={{ fill: "var(--color-muted)", opacity: 0.5 }} />
        {series.length > 1 && <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />}
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            stackId={stacked ? "a" : undefined}
            fill={s.color ?? CHART_COLORS[i % CHART_COLORS.length]}
            radius={stacked ? 2 : 4}
            animationDuration={700}
          />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
