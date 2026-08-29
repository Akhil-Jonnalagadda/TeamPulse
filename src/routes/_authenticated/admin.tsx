import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, SectionCard } from "@/components/common/SectionCard";
import { EmptyState } from "@/components/common/States";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administration — TeamPulse" },
      { name: "description", content: "Manage teams, applications and roles." },
      { property: "og:title", content: "Administration — TeamPulse" },
      { property: "og:description", content: "Manage teams, applications and roles." },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <div className="space-y-5">
      <PageHeader title="Administration" description="Manage teams, applications and roles." />
      <SectionCard title="Administration" description="This workspace area is being prepared" bodyClassName="p-0">
        <EmptyState title="Coming next" description="Data for this section will appear here shortly." />
      </SectionCard>
    </div>
  );
}
