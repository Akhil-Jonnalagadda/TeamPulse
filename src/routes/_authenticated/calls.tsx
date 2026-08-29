import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/States";

export const Route = createFileRoute("/_authenticated/calls")({
  head: () => ({
    meta: [
      { title: "Calls — TeamPulse" },
      { name: "description", content: "Bridge calls, standups and client conversations." },
      { property: "og:title", content: "Calls — TeamPulse" },
      { property: "og:description", content: "Bridge calls, standups and client conversations." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-5">
      <PageHeader title="Calls" description="Bridge calls, standups and client conversations." />
      <SectionCard title="Calls" description="This workspace area is being prepared" bodyClassName="p-0">
        <EmptyState title="Coming next" description="Data for this section will appear here shortly." />
      </SectionCard>
    </div>
  );
}
