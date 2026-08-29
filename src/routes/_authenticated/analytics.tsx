import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/States";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({
    meta: [
      { title: "Analytics — TeamPulse" },
      { name: "description", content: "Productivity and incident trends over time." },
      { property: "og:title", content: "Analytics — TeamPulse" },
      { property: "og:description", content: "Productivity and incident trends over time." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-5">
      <PageHeader title="Analytics" description="Productivity and incident trends over time." />
      <SectionCard title="Analytics" description="This workspace area is being prepared" bodyClassName="p-0">
        <EmptyState title="Coming next" description="Data for this section will appear here shortly." />
      </SectionCard>
    </div>
  );
}
