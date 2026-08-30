import { createFileRoute } from "@tanstack/react-router";
import { Activity, CheckCircle2, Clock, ShieldAlert } from "lucide-react";
import { useApplications } from "@/lib/queries";
import { MyRecordsPage, type MyRecordsConfig, type Row } from "@/components/records/MyRecordsPage";
import { SeverityBadge, StatusBadge } from "@/components/common/Badges";
import { INCIDENT_STATUSES, SEVERITIES } from "@/lib/constants";
import { titleCase } from "@/lib/format";

export const Route = createFileRoute("/_authenticated/my/incidents")({
  head: () => ({
    meta: [
      { title: "My Incidents — TeamPulse" },
      {
        name: "description",
        content:
          "Log the incidents you handled, how you triaged them and how they were resolved, all in one personal record.",
      },
      { property: "og:title", content: "My Incidents — TeamPulse" },
      { property: "og:description", content: "Personal incident and triage log in TeamPulse." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MyIncidentsPage,
});

function MyIncidentsPage() {
  const { data: apps } = useApplications();
  const appOptions = [
    { value: "none", label: "Not application specific" },
    ...(apps ?? []).map((a) => ({ value: a.id, label: a.name })),
  ];

  const config: MyRecordsConfig = {
    table: "incidents",
    title: "My Incidents",
    description: "Everything you handled — what broke, how you triaged it and how it was solved",
    icon: Activity,
    titleField: "title",
    searchFields: ["title", "incident_number", "root_cause", "resolution", "notes"],
    activityAction: "incident_logged",
    activityText: (v) => `logged incident ${String(v["incident_number"] ?? v["title"] ?? "")}`,
    filters: [
      { key: "severity", allLabel: "All severities", options: SEVERITIES, width: "w-[150px]" },
      { key: "status", allLabel: "All statuses", options: INCIDENT_STATUSES },
    ],
    fields: [
      { name: "incident_number", label: "Incident number", type: "text", required: true, maxLength: 60 },
      { name: "title", label: "Title", type: "text", required: true, maxLength: 200 },
      { name: "work_date", label: "Date", type: "date" },
      { name: "application_id", label: "Application", type: "select", options: appOptions },
      { name: "severity", label: "Severity", type: "select", options: SEVERITIES.map((s) => ({ value: s, label: s })) },
      {
        name: "status",
        label: "Status",
        type: "select",
        options: INCIDENT_STATUSES.map((s) => ({ value: s, label: titleCase(s) })),
      },
      { name: "duration_minutes", label: "Duration (min)", type: "number", min: 0, max: 2880 },
      { name: "bridge_duration", label: "Bridge time (min)", type: "number", min: 0, max: 2880 },
      { name: "bridge_required", label: "Bridge call required", type: "switch" },
      { name: "rca_required", label: "RCA required", type: "switch" },
      { name: "follow_up_required", label: "Follow-up required", type: "switch" },
      { name: "problem_ticket", label: "Problem ticket", type: "text", maxLength: 60 },
      { name: "description", label: "What happened", type: "textarea", maxLength: 2000 },
      {
        name: "notes",
        label: "Triage steps — how you investigated",
        type: "textarea",
        maxLength: 4000,
        placeholder: "1. Checked logs…  2. Verified queue depth…  3. Restarted service…",
        help: "Step-by-step of the triage you performed.",
      },
      { name: "business_impact", label: "Business impact", type: "textarea", maxLength: 2000 },
      { name: "root_cause", label: "Root cause", type: "textarea", maxLength: 2000 },
      { name: "resolution", label: "How it was solved", type: "textarea", maxLength: 2000 },
    ],
    stats: [
      { label: "Incidents", icon: Activity, value: (r) => r.length },
      {
        label: "Solved",
        icon: CheckCircle2,
        value: (r) => r.filter((x) => x["status"] === "resolved" || x["status"] === "closed").length,
        tone: () => "success",
      },
      {
        label: "Open",
        icon: ShieldAlert,
        value: (r) => r.filter((x) => x["status"] !== "resolved" && x["status"] !== "closed").length,
        tone: (r) =>
          r.some((x) => x["status"] !== "resolved" && x["status"] !== "closed") ? "danger" : "success",
      },
      {
        label: "Time on incidents",
        icon: Clock,
        value: (r) =>
          `${Math.round(r.reduce((s, x) => s + (Number(x["duration_minutes"]) || 0), 0) / 6) / 10}h`,
      },
    ],
    subtitle: (r: Row) =>
      `${String(r["incident_number"] ?? "No number")} · ${Number(r["duration_minutes"]) || 0} min${
        r["bridge_required"] ? " · bridge" : ""
      }`,
    badges: (r: Row) => (
      <div className="flex shrink-0 items-center gap-1.5">
        <SeverityBadge severity={String(r["severity"])} />
        <StatusBadge status={String(r["status"])} />
      </div>
    ),
    detail: [
      { key: "description", label: "What happened" },
      { key: "notes", label: "Triage steps" },
      { key: "root_cause", label: "Root cause" },
      { key: "resolution", label: "How it was solved" },
      { key: "business_impact", label: "Business impact" },
      { key: "problem_ticket", label: "Problem ticket" },
    ],
    csvRow: (r: Row) => ({
      number: r["incident_number"],
      title: r["title"],
      date: r["work_date"],
      severity: r["severity"],
      status: r["status"],
      duration_minutes: r["duration_minutes"],
      triage: r["notes"],
      root_cause: r["root_cause"],
      resolution: r["resolution"],
    }),
  };

  return <MyRecordsPage config={config} />;
}
