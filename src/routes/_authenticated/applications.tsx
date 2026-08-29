import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Boxes } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useApplications, useTeams } from "@/lib/queries";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { CardSkeleton, EmptyState } from "@/components/common/States";
import { BarsChart } from "@/components/charts/Charts";
import { SearchInput, Toolbar } from "@/components/common/Toolbar";
import { Badge } from "@/components/ui/badge";
import { daysAgoIso } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/applications")({
  head: () => ({
    meta: [
      { title: "Applications — TeamPulse" },
      {
        name: "description",
        content: "Supported applications, their criticality, owning team and incident load.",
      },
      { property: "og:title", content: "Applications — TeamPulse" },
      { property: "og:description", content: "Application health and incident load in TeamPulse." },
    ],
  }),
  component: ApplicationsPage,
});

function ApplicationsPage() {
  const { data: apps, isLoading } = useApplications();
  const { data: teams } = useTeams();
  const [search, setSearch] = useState("");

  const { data: incidents } = useQuery({
    queryKey: ["app-incidents"],
    queryFn: async () => {
      const { data: rows } = await supabase
        .from("incidents")
        .select("id, application_id, severity, status")
        .gte("work_date", daysAgoIso(29));
      return rows ?? [];
    },
  });

  const teamName = useMemo(() => new Map((teams ?? []).map((t) => [t.id, t.name])), [teams]);
  const filtered = (apps ?? []).filter((a) =>
    search ? a.name.toLowerCase().includes(search.toLowerCase()) : true,
  );

  const countFor = (id: string) => (incidents ?? []).filter((i) => i.application_id === id);

  const chart = filtered
    .map((a) => ({ label: a.name, Incidents: countFor(a.id).length }))
    .sort((a, b) => b.Incidents - a.Incidents)
    .slice(0, 10);

  const critical = filtered.filter((a) => a.criticality === "critical" || a.criticality === "high");

  return (
    <div className="space-y-5">
      <PageHeader title="Applications" description={`${filtered.length} supported applications`} />

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Applications" value={filtered.length} icon={Boxes} loading={isLoading} />
        <StatCard label="High criticality" value={critical.length} icon={Boxes} tone="warning" loading={isLoading} />
        <StatCard label="Incidents (30d)" value={(incidents ?? []).length} icon={Boxes} tone="danger" loading={isLoading} />
      </div>

      <SectionCard title="Incident load" description="Last 30 days">
        <BarsChart data={chart} series={[{ key: "Incidents", label: "Incidents" }]} />
      </SectionCard>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search applications…" />
      </Toolbar>

      {isLoading ? (
        <SectionCard title="Catalogue" description="Loading">
          <CardSkeleton rows={5} />
        </SectionCard>
      ) : filtered.length === 0 ? (
        <SectionCard title="Catalogue" description="Nothing found">
          <EmptyState icon={Boxes} title="No applications" />
        </SectionCard>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a) => {
            const list = countFor(a.id);
            const open = list.filter((i) => i.status !== "resolved" && i.status !== "closed").length;
            return (
              <article key={a.id} className="surface flex flex-col gap-2 p-4">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="text-sm font-semibold">{a.name}</h3>
                  <Badge variant={a.criticality === "critical" ? "destructive" : "secondary"}>
                    {a.criticality}
                  </Badge>
                </div>
                {a.description && (
                  <p className="text-muted-foreground line-clamp-3 text-sm">{a.description}</p>
                )}
                <dl className="text-muted-foreground mt-auto grid grid-cols-2 gap-1 pt-2 text-xs">
                  <div>
                    <dt className="uppercase">Owner</dt>
                    <dd className="text-foreground font-medium">
                      {teamName.get(a.owner_team_id ?? "") ?? "Unassigned"}
                    </dd>
                  </div>
                  <div>
                    <dt className="uppercase">Support</dt>
                    <dd className="text-foreground font-medium">{a.support_hours}</dd>
                  </div>
                  <div>
                    <dt className="uppercase">Incidents 30d</dt>
                    <dd className="text-foreground font-medium">{list.length}</dd>
                  </div>
                  <div>
                    <dt className="uppercase">Open</dt>
                    <dd className="text-foreground font-medium">{open}</dd>
                  </div>
                </dl>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
