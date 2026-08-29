import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/States";

export const Route = createFileRoute("/_authenticated/learning")({
  head: () => ({
    meta: [
      { title: "Learning Hub — TeamPulse" },
      { name: "description", content: "Knowledge shared across the team." },
      { property: "og:title", content: "Learning Hub — TeamPulse" },
      { property: "og:description", content: "Knowledge shared across the team." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-5">
      <PageHeader title="Learning Hub" description="Knowledge shared across the team." />
      <SectionCard title="Learning Hub" description="This workspace area is being prepared" bodyClassName="p-0">
        <EmptyState title="Coming next" description="Data for this section will appear here shortly." />
      </SectionCard>
    </div>
  );
}
