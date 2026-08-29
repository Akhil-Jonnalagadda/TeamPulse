import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/States";

export const Route = createFileRoute("/_authenticated/applications")({
  head: () => ({
    meta: [
      { title: "Applications — TeamPulse" },
      { name: "description", content: "Supported applications and their incident load." },
      { property: "og:title", content: "Applications — TeamPulse" },
      { property: "og:description", content: "Supported applications and their incident load." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-5">
      <PageHeader title="Applications" description="Supported applications and their incident load." />
      <SectionCard title="Applications" description="This workspace area is being prepared" bodyClassName="p-0">
        <EmptyState title="Coming next" description="Data for this section will appear here shortly." />
      </SectionCard>
    </div>
  );
}
