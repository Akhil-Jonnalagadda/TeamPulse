import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/States";

export const Route = createFileRoute("/_authenticated/analysis")({
  head: () => ({
    meta: [
      { title: "Analysis — TeamPulse" },
      { name: "description", content: "Investigations and root-cause work." },
      { property: "og:title", content: "Analysis — TeamPulse" },
      { property: "og:description", content: "Investigations and root-cause work." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-5">
      <PageHeader title="Analysis" description="Investigations and root-cause work." />
      <SectionCard title="Analysis" description="This workspace area is being prepared" bodyClassName="p-0">
        <EmptyState title="Coming next" description="Data for this section will appear here shortly." />
      </SectionCard>
    </div>
  );
}
