import { createFileRoute } from "@tanstack/react-router";
import { BookOpen, GraduationCap, Share2, Sparkles } from "lucide-react";
import { MyRecordsPage, type MyRecordsConfig, type Row } from "@/components/records/MyRecordsPage";
import { Badge } from "@/components/ui/badge";
import { LEARNING_CATEGORIES } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/my/learning")({
  head: () => ({
    meta: [
      { title: "My Learning — TeamPulse" },
      {
        name: "description",
        content: "Capture what you learned each day, the technology involved and whether it is worth sharing.",
      },
      { property: "og:title", content: "My Learning — TeamPulse" },
      { property: "og:description", content: "Personal knowledge log in TeamPulse." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyLearningPage,
});

function MyLearningPage() {
  const config: MyRecordsConfig = {
    table: "learnings",
    title: "My Learning",
    description: "What you picked up — technologies, processes and knowledge worth keeping",
    icon: BookOpen,
    titleField: "title",
    searchFields: ["title", "description", "technology", "source"],
    activityAction: "learning_logged",
    activityText: (v) => `logged a learning: ${String(v["title"] ?? "")}`,
    filters: [
      { key: "category", allLabel: "All categories", options: LEARNING_CATEGORIES, width: "w-[180px]" },
    ],
    fields: [
      { name: "title", label: "Title", type: "text", required: true, maxLength: 200 },
      { name: "work_date", label: "Date", type: "date" },
      {
        name: "category",
        label: "Category",
        type: "select",
        options: LEARNING_CATEGORIES.map((c) => ({ value: c, label: c })),
      },
      { name: "technology", label: "Technology / tool", type: "text", maxLength: 120 },
      { name: "source", label: "Source", type: "text", maxLength: 200 },
      { name: "description", label: "What you learned", type: "textarea", maxLength: 3000 },
      { name: "useful_for_team", label: "Useful for the team", type: "switch" },
      { name: "share_with_team", label: "Share with the team", type: "switch" },
    ],
    stats: [
      { label: "Entries", icon: BookOpen, value: (r) => r.length },
      {
        label: "Shared",
        icon: Share2,
        value: (r) => r.filter((x) => Boolean(x["share_with_team"])).length,
        tone: () => "success",
      },
      {
        label: "Technologies",
        icon: Sparkles,
        value: (r) => new Set(r.map((x) => String(x["technology"] ?? "").trim()).filter(Boolean)).size,
      },
      {
        label: "Categories",
        icon: GraduationCap,
        value: (r) => new Set(r.map((x) => String(x["category"] ?? ""))).size,
      },
    ],
    subtitle: (r: Row) =>
      `${String(r["category"] ?? "Other")}${r["technology"] ? ` · ${String(r["technology"])}` : ""}`,
    badges: (r: Row) =>
      r["share_with_team"] ? (
        <Badge variant="secondary" className="shrink-0">
          Shared
        </Badge>
      ) : (
        <Badge variant="outline" className="shrink-0">
          Private
        </Badge>
      ),
    detail: [
      { key: "description", label: "What you learned" },
      { key: "technology", label: "Technology" },
      { key: "source", label: "Source" },
    ],
    csvRow: (r: Row) => ({
      title: r["title"],
      date: r["work_date"],
      category: r["category"],
      technology: r["technology"],
      source: r["source"],
      shared: r["share_with_team"],
    }),
  };

  return <MyRecordsPage config={config} />;
}
