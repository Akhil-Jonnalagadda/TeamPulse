import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/States";

export const Route = createFileRoute("/_authenticated/incidents")({
  head: () => ({
    meta: [
      { title: "Incidents — TeamPulse" },
      { name: "description", content: "Track production incidents by severity and status." },
      { property: "og:title", content: "Incidents — TeamPulse" },
      { property: "og:description", content: "Track production incidents by severity and status." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-5">
      <PageHeader title="Incidents" description="Track production incidents by severity and status." />
      <SectionCard title="Incidents" description="This workspace area is being prepared" bodyClassName="p-0">
        <EmptyState title="Coming next" description="Data for this section will appear here shortly." />
      </SectionCard>
    </div>
  );
}
