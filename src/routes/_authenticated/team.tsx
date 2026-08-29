import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/States";

export const Route = createFileRoute("/_authenticated/team")({
  head: () => ({
    meta: [
      { title: "Team — TeamPulse" },
      { name: "description", content: "People, shifts and applications across your team." },
      { property: "og:title", content: "Team — TeamPulse" },
      { property: "og:description", content: "People, shifts and applications across your team." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-5">
      <PageHeader title="Team" description="People, shifts and applications across your team." />
      <SectionCard title="Team" description="This workspace area is being prepared" bodyClassName="p-0">
        <EmptyState title="Coming next" description="Data for this section will appear here shortly." />
      </SectionCard>
    </div>
  );
}
