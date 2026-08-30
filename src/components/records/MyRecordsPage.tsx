import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { LucideIcon } from "lucide-react";
import { Download, Pencil, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { useRealtimeInvalidate } from "@/hooks/use-realtime";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { CardSkeleton, EmptyState } from "@/components/common/States";
import { FilterSelect, RangeSelect, SearchInput, Toolbar } from "@/components/common/Toolbar";
import { EntityDialog, type FieldSpec, type FormValues } from "@/components/forms/EntityDialog";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { StatCard } from "@/components/common/StatCard";
import { daysAgoIso, downloadCsv, shortDate } from "@/lib/format";

export type MyRecordTable = "incidents" | "calls" | "learnings";

export type Row = Record<string, unknown>;

export interface MyRecordsStat {
  label: string;
  icon: LucideIcon;
  value: (rows: Row[]) => string | number;
  tone?: (rows: Row[]) => "default" | "success" | "warning" | "danger";
}

export interface MyRecordsConfig {
  table: MyRecordTable;
  title: string;
  description: string;
  icon: LucideIcon;
  /** column used as the headline of each row */
  titleField: string;
  /** columns searched by the search box */
  searchFields: string[];
  fields: FieldSpec[];
  filters?: { key: string; allLabel: string; options: readonly string[]; width?: string }[];
  stats: MyRecordsStat[];
  /** compact secondary line shown in the list */
  subtitle: (row: Row) => string;
  /** badges shown on the right of the list row */
  badges?: (row: Row) => React.ReactNode;
  /** long-form fields revealed when a row is expanded */
  detail: { key: string; label: string }[];
  csvRow: (row: Row) => Record<string, unknown>;
  activityAction: string;
  activityText: (values: FormValues) => string;
}

function cleanPayload(values: FormValues): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(values)) {
    if (v === "none" || v === "" || v === null) continue;
    out[k] = v;
  }
  return out;
}

function initialFrom(fields: FieldSpec[], row: Row): FormValues {
  const out: FormValues = {};
  for (const f of fields) {
    const v = row[f.name];
    if (v === null || v === undefined) continue;
    out[f.name] = v as string | number | boolean;
  }
  return out;
}

export function MyRecordsPage({ config }: { config: MyRecordsConfig }) {
  const { profile, teamId } = useCurrentUser();
  const userId = profile?.id;
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [range, setRange] = useState("30");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [addOpen, setAddOpen] = useState(false);
  const [editRow, setEditRow] = useState<Row | null>(null);

  const since = daysAgoIso(Number(range) - 1);
  const listKey = ["my-records", config.table, userId, range];

  useRealtimeInvalidate([config.table], [["my-records", config.table], ["member-dashboard"]], {
    ...(userId ? { filter: `user_id=eq.${userId}` } : {}),
  });

  const { data, isLoading } = useQuery({
    queryKey: listKey,
    enabled: Boolean(userId),
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from(config.table)
        .select("*")
        .eq("user_id", userId!)
        .gte("work_date", since)
        .order("work_date", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (rows ?? []) as Row[];
    },
  });

  const save = useMutation({
    mutationFn: async ({ values, id }: { values: FormValues; id?: string }) => {
      const payload = cleanPayload(values);
      // switches must persist "off" too
      for (const f of config.fields) {
        if (f.type === "switch") payload[f.name] = Boolean(values[f.name]);
      }
      if (id) {
        const { error } = await supabase
          .from(config.table)
          .update(payload as never)
          .eq("id", id);
        if (error) throw error;
        return;
      }
      payload["user_id"] = userId;
      payload["team_id"] = teamId;
      const { error } = await supabase.from(config.table).insert(payload as never);
      if (error) throw error;
      await supabase.from("activity_logs").insert({
        actor_id: userId!,
        team_id: teamId,
        action: config.activityAction,
        entity_type: config.table,
        description: config.activityText(values),
      });
    },
    onSuccess: (_r, vars) => {
      setAddOpen(false);
      setEditRow(null);
      toast.success(vars.id ? "Changes saved" : `${config.title} entry added`);
      void queryClient.invalidateQueries({ queryKey: ["my-records", config.table] });
      void queryClient.invalidateQueries({ queryKey: ["member-dashboard"] });
      void queryClient.invalidateQueries({ queryKey: ["activity"] });
    },
    onError: (e) => toast.error("Could not save", { description: (e as Error).message }),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(config.table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Entry removed");
      void queryClient.invalidateQueries({ queryKey: ["my-records", config.table] });
      void queryClient.invalidateQueries({ queryKey: ["member-dashboard"] });
    },
    onError: (e) => toast.error("Could not delete", { description: (e as Error).message }),
  });

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return (data ?? []).filter((r) => {
      for (const f of config.filters ?? []) {
        const active = filters[f.key] ?? "all";
        if (active !== "all" && String(r[f.key] ?? "") !== active) return false;
      }
      if (!term) return true;
      return config.searchFields.some((k) =>
        String(r[k] ?? "")
          .toLowerCase()
          .includes(term),
      );
    });
  }, [data, search, filters, config]);

  const Icon = config.icon;

  return (
    <div className="space-y-5">
      <PageHeader title={config.title} description={config.description}>
        <Button
          variant="outline"
          onClick={() => downloadCsv(`${config.table}-${since}.csv`, rows.map(config.csvRow))}
          disabled={rows.length === 0}
        >
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add entry
        </Button>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {config.stats.map((s) => (
          <StatCard
            key={s.label}
            label={s.label}
            value={s.value(rows)}
            icon={s.icon}
            loading={isLoading}
            {...(s.tone ? { tone: s.tone(rows) } : {})}
          />
        ))}
      </div>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder={`Search ${config.title.toLowerCase()}…`} />
        {(config.filters ?? []).map((f) => (
          <FilterSelect
            key={f.key}
            value={filters[f.key] ?? "all"}
            onChange={(v) => setFilters((prev) => ({ ...prev, [f.key]: v }))}
            options={f.options}
            allLabel={f.allLabel}
            {...(f.width ? { width: f.width } : {})}
          />
        ))}
        <RangeSelect value={range} onChange={setRange} />
      </Toolbar>

      <SectionCard title="My log" description="Newest first — expand a row for the full write-up" bodyClassName="p-0">
        {isLoading ? (
          <div className="p-4">
            <CardSkeleton rows={5} />
          </div>
        ) : rows.length === 0 ? (
          <div className="p-4">
            <EmptyState
              icon={Icon}
              title={`No ${config.title.toLowerCase()} yet`}
              description="Add your first entry — it also shows up on your dashboard."
              actionLabel="Add entry"
              onAction={() => setAddOpen(true)}
            />
          </div>
        ) : (
          <Accordion type="multiple" className="divide-y">
            {rows.map((r) => {
              const id = String(r["id"]);
              return (
                <AccordionItem key={id} value={id} className="border-b-0">
                  <div className="flex items-center gap-2 pr-3">
                    <AccordionTrigger className="flex-1 px-4 py-3 hover:no-underline">
                      <div className="flex min-w-0 flex-1 flex-wrap items-center gap-3 text-left">
                        <div className="min-w-[180px] flex-1">
                          <p className="truncate text-sm font-medium">{String(r[config.titleField] ?? "Untitled")}</p>
                          <p className="text-muted-foreground truncate text-xs">
                            {shortDate(String(r["work_date"]))} · {config.subtitle(r)}
                          </p>
                        </div>
                        {config.badges?.(r)}
                      </div>
                    </AccordionTrigger>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-8 w-8 shrink-0"
                      aria-label="Edit entry"
                      onClick={() => setEditRow(r)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-muted-foreground hover:text-destructive h-8 w-8 shrink-0"
                      aria-label="Delete entry"
                      onClick={() => remove.mutate(id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <AccordionContent className="px-4 pb-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      {config.detail.map((d) => (
                        <div key={d.key} className="bg-muted/40 rounded-lg p-3">
                          <p className="text-muted-foreground text-xs font-medium uppercase tracking-wide">
                            {d.label}
                          </p>
                          <p className="mt-1 whitespace-pre-wrap text-sm">
                            {String(r[d.key] ?? "").trim() || "—"}
                          </p>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </SectionCard>

      <EntityDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        title={`Add ${config.title.toLowerCase()} entry`}
        description={config.description}
        fields={config.fields}
        pending={save.isPending}
        onSubmit={(values) => save.mutate({ values })}
        submitLabel="Save entry"
      />

      <EntityDialog
        open={Boolean(editRow)}
        onOpenChange={(v) => !v && setEditRow(null)}
        title="Edit entry"
        description="Update the details of this record"
        fields={config.fields}
        {...(editRow ? { initial: initialFrom(config.fields, editRow) } : {})}
        pending={save.isPending}
        onSubmit={(values) => save.mutate({ values, id: String(editRow?.["id"]) })}
        submitLabel="Save changes"
      />
    </div>
  );
}
