import { useMemo, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BookOpen, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useCurrentUser } from "@/hooks/use-session";
import { useMembers } from "@/lib/queries";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { StatCard } from "@/components/common/StatCard";
import { CardSkeleton, EmptyState } from "@/components/common/States";
import { UserAvatar } from "@/components/common/UserAvatar";
import { FilterSelect, RangeSelect, SearchInput, Toolbar } from "@/components/common/Toolbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LEARNING_CATEGORIES } from "@/lib/constants";
import { daysAgoIso, downloadCsv, shortDate } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/learning")({
  head: () => ({
    meta: [
      { title: "Learning Hub — TeamPulse" },
      {
        name: "description",
        content: "Knowledge shared across the team: technical notes, process learnings and KT records.",
      },
      { property: "og:title", content: "Learning Hub — TeamPulse" },
      { property: "og:description", content: "Shared team knowledge in TeamPulse." },
    ],
  }),
  component: LearningPage,
});

function LearningPage() {
  const { profile, role, teamId } = useCurrentUser();
  const { data: members } = useMembers(role === "manager" ? null : teamId);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [range, setRange] = useState("30");
  const since = daysAgoIso(Number(range) - 1);

  const { data, isLoading } = useQuery({
    queryKey: ["learning-list", range],
    enabled: Boolean(profile),
    queryFn: async () => {
      const { data: rows, error } = await supabase
        .from("learnings")
        .select("id, title, description, category, technology, source, useful_for_team, user_id, work_date")
        .gte("work_date", since)
        .order("work_date", { ascending: false });
      if (error) throw error;
      return rows ?? [];
    },
  });

  const memberName = useMemo(
    () => new Map((members ?? []).map((m) => [m.id, m.full_name])),
    [members],
  );

  const filtered = (data ?? []).filter((l) => {
    if (category !== "all" && l.category !== category) return false;
    if (
      search &&
      !`${l.title} ${l.description ?? ""} ${l.technology ?? ""}`
        .toLowerCase()
        .includes(search.toLowerCase())
    )
      return false;
    return true;
  });

  const contributors = new Set(filtered.map((l) => l.user_id)).size;
  const useful = filtered.filter((l) => l.useful_for_team).length;

  return (
    <div className="space-y-5">
      <PageHeader title="Learning hub" description={`${filtered.length} learnings shared in the selected period`}>
        <Button
          variant="outline"
          onClick={() =>
            downloadCsv(
              `learnings-${since}.csv`,
              filtered.map((l) => ({
                date: l.work_date,
                title: l.title,
                category: l.category,
                technology: l.technology ?? "",
                author: memberName.get(l.user_id) ?? "",
              })),
            )
          }
        >
          <Download className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </PageHeader>

      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Learnings" value={filtered.length} icon={BookOpen} loading={isLoading} />
        <StatCard label="Contributors" value={contributors} icon={BookOpen} tone="success" loading={isLoading} />
        <StatCard label="Marked useful" value={useful} icon={BookOpen} tone="warning" loading={isLoading} />
      </div>

      <Toolbar>
        <SearchInput value={search} onChange={setSearch} placeholder="Search knowledge…" />
        <FilterSelect value={category} onChange={setCategory} options={LEARNING_CATEGORIES} allLabel="All categories" width="w-[180px]" />
        <RangeSelect value={range} onChange={setRange} />
      </Toolbar>

      {isLoading ? (
        <SectionCard title="Shared knowledge" description="Loading">
          <CardSkeleton rows={5} />
        </SectionCard>
      ) : filtered.length === 0 ? (
        <SectionCard title="Shared knowledge" description="Nothing yet">
          <EmptyState icon={BookOpen} title="No learnings shared" description="Learnings added in daily updates appear here." />
        </SectionCard>
      ) : (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((l) => (
            <article key={l.id} className="surface flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-semibold">{l.title}</h3>
                <Badge variant="secondary">{l.category}</Badge>
              </div>
              {l.description && (
                <p className="text-muted-foreground line-clamp-4 text-sm">{l.description}</p>
              )}
              {l.technology && (
                <p className="text-muted-foreground text-xs">Tech: {l.technology}</p>
              )}
              <div className="mt-auto flex items-center gap-2 pt-2">
                <UserAvatar name={memberName.get(l.user_id) ?? "Member"} size="sm" />
                <p className="text-muted-foreground truncate text-xs">
                  {memberName.get(l.user_id) ?? "Team member"} · {shortDate(l.work_date)}
                </p>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
