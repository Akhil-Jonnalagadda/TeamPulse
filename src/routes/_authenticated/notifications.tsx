import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/States";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications — TeamPulse" },
      { name: "description", content: "Everything that needs your attention." },
      { property: "og:title", content: "Notifications — TeamPulse" },
      { property: "og:description", content: "Everything that needs your attention." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-5">
      <PageHeader title="Notifications" description="Everything that needs your attention." />
      <SectionCard title="Notifications" description="This workspace area is being prepared" bodyClassName="p-0">
        <EmptyState title="Coming next" description="Data for this section will appear here shortly." />
      </SectionCard>
    </div>
  );
}
