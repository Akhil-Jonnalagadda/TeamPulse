import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/States";

export const Route = createFileRoute("/_authenticated/updates")({
  head: () => ({
    meta: [
      { title: "Daily Updates — TeamPulse" },
      { name: "description", content: "Browse and filter submitted daily updates." },
      { property: "og:title", content: "Daily Updates — TeamPulse" },
      { property: "og:description", content: "Browse and filter submitted daily updates." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-5">
      <PageHeader title="Daily Updates" description="Browse and filter submitted daily updates." />
      <SectionCard title="Daily Updates" description="This workspace area is being prepared" bodyClassName="p-0">
        <EmptyState title="Coming next" description="Data for this section will appear here shortly." />
      </SectionCard>
    </div>
  );
}
