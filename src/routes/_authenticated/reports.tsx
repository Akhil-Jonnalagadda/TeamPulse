import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/States";

export const Route = createFileRoute("/_authenticated/reports")({
  head: () => ({
    meta: [
      { title: "Reports — TeamPulse" },
      { name: "description", content: "Export daily, weekly and monthly operational reports." },
      { property: "og:title", content: "Reports — TeamPulse" },
      { property: "og:description", content: "Export daily, weekly and monthly operational reports." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-5">
      <PageHeader title="Reports" description="Export daily, weekly and monthly operational reports." />
      <SectionCard title="Reports" description="This workspace area is being prepared" bodyClassName="p-0">
        <EmptyState title="Coming next" description="Data for this section will appear here shortly." />
      </SectionCard>
    </div>
  );
}
