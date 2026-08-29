import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/States";

export const Route = createFileRoute("/_authenticated/dashboard/manager")({
  head: () => ({
    meta: [
      { title: "Organisation Dashboard — TeamPulse" },
      { name: "description", content: "Cross-team productivity, incidents and submission compliance." },
      { property: "og:title", content: "Organisation Dashboard — TeamPulse" },
      { property: "og:description", content: "Cross-team productivity, incidents and submission compliance." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-5">
      <PageHeader title="Organisation Dashboard" description="Cross-team productivity, incidents and submission compliance." />
      <SectionCard title="Organisation Dashboard" description="This workspace area is being prepared" bodyClassName="p-0">
        <EmptyState title="Coming next" description="Data for this section will appear here shortly." />
      </SectionCard>
    </div>
  );
}
