import { createFileRoute } from "@tanstack/react-router";
import { Clock, ListChecks, PhoneCall, Users } from "lucide-react";
import { MyRecordsPage, type MyRecordsConfig, type Row } from "@/components/records/MyRecordsPage";
import { Badge } from "@/components/ui/badge";
import { CALL_TYPES } from "@/lib/constants";

export const Route = createFileRoute("/_authenticated/my/calls")({
  head: () => ({
    meta: [
      { title: "My Calls — TeamPulse" },
      {
        name: "description",
        content: "Record the bridges, standups and client calls you joined, with discussion points and action items.",
      },
      { property: "og:title", content: "My Calls — TeamPulse" },
      { property: "og:description", content: "Personal call and meeting log in TeamPulse." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyCallsPage,
});

function MyCallsPage() {
  const config: MyRecordsConfig = {
    table: "calls",
    title: "My Calls",
    description: "Bridges, standups and client conversations you took part in",
    icon: PhoneCall,
    titleField: "title",
    searchFields: ["title", "organizer", "participants", "purpose", "discussion", "action_items"],
    activityAction: "call_logged",
    activityText: (v) => `logged a call: ${String(v["title"] ?? "")}`,
    filters: [{ key: "call_type", allLabel: "All call types", options: CALL_TYPES, width: "w-[190px]" }],
    fields: [
      { name: "title", label: "Title", type: "text", required: true, maxLength: 200 },
      { name: "work_date", label: "Date", type: "date" },
      { name: "call_type", label: "Type", type: "select", options: CALL_TYPES.map((c) => ({ value: c, label: c })) },
      { name: "duration_minutes", label: "Duration (min)", type: "number", min: 0, max: 1440 },
      { name: "organizer", label: "Organizer", type: "text", maxLength: 120 },
      { name: "participants", label: "Participants", type: "text", maxLength: 300 },
      { name: "purpose", label: "Purpose", type: "textarea", maxLength: 1000 },
      { name: "discussion", label: "Discussion points", type: "textarea", maxLength: 2000 },
      { name: "action_items", label: "Action items", type: "textarea", maxLength: 2000 },
    ],
    stats: [
      { label: "Calls", icon: PhoneCall, value: (r) => r.length },
      {
        label: "Time in calls",
        icon: Clock,
        value: (r) => `${Math.round(r.reduce((s, x) => s + (Number(x["duration_minutes"]) || 0), 0) / 6) / 10}h`,
      },
      {
        label: "Bridges",
        icon: Users,
        value: (r) => r.filter((x) => x["call_type"] === "Incident Bridge").length,
        tone: () => "warning",
      },
      {
        label: "With action items",
        icon: ListChecks,
        value: (r) => r.filter((x) => String(x["action_items"] ?? "").trim().length > 0).length,
        tone: () => "success",
      },
    ],
    subtitle: (r: Row) => `${String(r["call_type"] ?? "Call")} · ${Number(r["duration_minutes"]) || 0} min`,
    badges: (r: Row) => (
      <Badge variant="secondary" className="shrink-0">
        {String(r["organizer"] ?? "No organizer")}
      </Badge>
    ),
    detail: [
      { key: "purpose", label: "Purpose" },
      { key: "discussion", label: "Discussion points" },
      { key: "action_items", label: "Action items" },
      { key: "participants", label: "Participants" },
    ],
    csvRow: (r: Row) => ({
      title: r["title"],
      date: r["work_date"],
      type: r["call_type"],
      duration_minutes: r["duration_minutes"],
      organizer: r["organizer"],
      action_items: r["action_items"],
    }),
  };

  return <MyRecordsPage config={config} />;
}
