import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/States";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({
    meta: [
      { title: "Settings — TeamPulse" },
      { name: "description", content: "Your profile, shift and notification preferences." },
      { property: "og:title", content: "Settings — TeamPulse" },
      { property: "og:description", content: "Your profile, shift and notification preferences." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-5">
      <PageHeader title="Settings" description="Your profile, shift and notification preferences." />
      <SectionCard title="Settings" description="This workspace area is being prepared" bodyClassName="p-0">
        <EmptyState title="Coming next" description="Data for this section will appear here shortly." />
      </SectionCard>
    </div>
  );
}
