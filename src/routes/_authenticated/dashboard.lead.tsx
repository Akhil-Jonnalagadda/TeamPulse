import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/States";

export const Route = createFileRoute("/_authenticated/dashboard/lead")({
  head: () => ({
    meta: [
      { title: "Team Dashboard — TeamPulse" },
      { name: "description", content: "Live view of your team's day: submissions, incidents and workload." },
      { property: "og:title", content: "Team Dashboard — TeamPulse" },
      { property: "og:description", content: "Live view of your team's day: submissions, incidents and workload." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-5">
      <PageHeader title="Team Dashboard" description="Live view of your team's day: submissions, incidents and workload." />
      <SectionCard title="Team Dashboard" description="This workspace area is being prepared" bodyClassName="p-0">
        <EmptyState title="Coming next" description="Data for this section will appear here shortly." />
      </SectionCard>
    </div>
  );
}
