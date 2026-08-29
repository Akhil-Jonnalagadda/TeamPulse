import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Download, Microscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { useApplications, useMembers } from "@/lib/queries";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { CardSkeleton, EmptyState } from "@/components/common/States";
import { StatusBadge } from "@/components/common/Badges";
import { FilterSelect, OptionSelect, RangeSelect, SearchInput, Toolbar } from "@/components/common/Toolbar";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { ANALYSIS_STATUSES } from "@/lib/constants";
import { daysAgoIso, downloadCsv, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/analysis")({
  head: () => ({
    meta: [
      { title: "Analysis — TeamPulse" },
      {
        name: "description",
        content: "Investigations, findings and root-cause analysis carried out by the team.",
      },
      { property: "og:title", content: "Analysis — TeamPulse" },
      { property: "og:description", content: "Root-cause and investigation tracking in TeamPulse." },
    ],
  }),
  component: AnalysisPage,
});

function AnalysisPage() {
  const { profile, role, teamId } = useCurrentUser();
  const { data: members } = useMembers(role === "manager" ? null : teamId);
  const { data: apps } = useApplications();
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [app, setApp] = useState("all");
  const [range, setRange] = useState("30");
  const since = daysAgoIso(Number(range) - 1);

  const { data, isLoading } = useQuery({
    queryKey: ["analysis-list", role, teamId, range],
    enabled: Boolean(profile),
    queryFn: async () => {
      let q = supabase
        .from("analyses")
        .select(
          "id, title, problem_statement, observations, findings, root_cause, recommendation, status, application_id, reference_ticket, user_id, work_date",
        )
        .gte("work_date", since)
        .order("work_date", { ascending: false });
      if (role === "team_member") q = q.eq("user_id", profile!.id);
      else if (role === "team_lead" && teamId) q = q.eq("team_id", teamId);
      const { data: rows, error } = await q;
      if (error) throw error;
      return rows ?? [];
    },
  });

  const memberName = useMemo(
    () => new Map((members ?? []).map((m) => [m.id, m.full_name])),
    [members],
  );
  const appName = useMemo(() => new Map((apps ?? []).map((a) => [a.id, a.name])), [apps]);

  const filtered = (data ?? []).filter((a) => {
    if (status !== "all" && a.status !== status) return false;
    if (app !== "all" && a.application_id !== app) return false;
    if (search && !`${a.title} ${a.problem_statement ?? ""}`.toLowerCase().includes(search.toLowerCase()))
      return false;
    return true;
  });

  const completed = filtered.filter((a) => a.status === "completed").length;
  const withRootCause = filtered.filter((a) => Boolean(a.root_cause)).length;

  return (
    <div className="space-y-5">
      <PageHeader title="Analysis" description={`${filtered.length} investigations in the selected period`}>
        <Button
          variant="outline"
          onClick={() =>
            downloadCsv(
              `analysis-${since}.csv`,
              filtered.map((a) => ({
                date: a.work_date,
                title: a.title,
                status: a.status,
                application: appName.get(a.application_id ?? "") ?? "",
                owner: memberName.get(a.user_id) ?? "",
                root_cause: a.root_cause ?? "",
                recommendation: a.recommendation ?? "",
              })),
            )
          }
        >
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Investigations" value={filtered.length} icon={Microscope} loading={isLoading} />
        <StatCard label="Completed" value={completed} icon={Microscope} tone="success" loading={isLoading} />
        <StatCard label="Root cause found" value={withRootCause} icon={Microscope} tone="warning" loading={isLoading} />
      </div>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search analysis…" />
        <FilterSelect value={status} onChange={setStatus} options={ANALYSIS_STATUSES} allLabel="All statuses" />
        <OptionSelect
          value={app}
          onChange={setApp}
          options={(apps ?? []).map((a) => ({ id: a.id, name: a.name }))}
          allLabel="All applications"
        />
        <RangeSelect value={range} onChange={setRange} />
      </Toolbar>

      <SectionCard title="Investigations" description="Expand for findings" bodyClassName="p-0">
        {isLoading ? (
          <div className="p-4">
            <CardSkeleton rows={5} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-4">
            <EmptyState icon={Microscope} title="No analysis records" description="Analyses logged in daily updates appear here." />
          </div>
        ) : (
          <Accordion type="single" collapsible className="divide-y">
            {filtered.map((a) => (
              <AccordionItem key={a.id} value={a.id} className="border-0">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <div className="flex min-w-0 flex-1 items-center gap-3 pr-3 text-left">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{a.title}</p>
                      <p className="text-muted-foreground truncate text-xs">
                        {appName.get(a.application_id ?? "") ?? "General"} ·{" "}
                        {memberName.get(a.user_id) ?? "Team member"} · {shortDate(a.work_date)}
                      </p>
                    </div>
                    <StatusBadge status={a.status} />
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-3 px-4 pb-4 text-sm">
                  <Field label="Problem statement" value={a.problem_statement} />
                  <Field label="Observations" value={a.observations} />
                  <Field label="Findings" value={a.findings} />
                  <Field label="Root cause" value={a.root_cause} />
                  <Field label="Recommendation" value={a.recommendation} />
                  {a.reference_ticket && (
                    <p className="text-muted-foreground text-xs">Ticket: {a.reference_ticket}</p>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </SectionCard>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-muted-foreground text-[11px] font-medium uppercase">{label}</p>
      <p className="mt-0.5 whitespace-pre-wrap">{value}</p>
    </div>
  );
}
