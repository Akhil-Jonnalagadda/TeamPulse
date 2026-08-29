export const TASK_CATEGORIES = [
  "Production Support",
  "Development",
  "Testing",
  "Deployment",
  "Monitoring",
  "Bug Fix",
  "Documentation",
  "Analysis",
  "Meeting",
  "Incident",
  "Service Request",
  "Change Request",
  "Problem Management",
  "Automation",
  "Knowledge Transfer",
  "Other",
] as const;

export const TASK_STATUSES = ["completed", "in_progress", "blocked", "pending"] as const;
export const PRIORITIES = ["low", "medium", "high", "critical"] as const;
export const SEVERITIES = ["P1", "P2", "P3", "P4"] as const;
export const INCIDENT_STATUSES = [
  "open",
  "investigating",
  "monitoring",
  "resolved",
  "closed",
] as const;
export const ANALYSIS_STATUSES = ["started", "in_progress", "completed", "needs_review"] as const;

export const CALL_TYPES = [
  "Daily Standup",
  "Incident Bridge",
  "Client Call",
  "Internal Meeting",
  "KT Session",
  "Planning",
  "Review",
  "Release Call",
  "Change Call",
  "Problem Management",
  "Vendor Call",
  "Other",
] as const;

export const LEARNING_CATEGORIES = [
  "Technical",
  "Application",
  "Process",
  "Production Support",
  "Cloud",
  "Database",
  "DevOps",
  "Monitoring",
  "Automation",
  "Business",
  "Other",
] as const;

export const SHIFTS = ["General", "Morning", "Afternoon", "Night"] as const;
export const LOCATIONS = ["Office", "Remote", "Hybrid", "Client Site"] as const;

export const SEVERITY_LABEL: Record<string, string> = {
  P1: "P1 Critical",
  P2: "P2 High",
  P3: "P3 Medium",
  P4: "P4 Low",
};

export const DATE_PRESETS = [
  { id: "today", label: "Today", days: 0 },
  { id: "7d", label: "Last 7 days", days: 6 },
  { id: "14d", label: "Last 14 days", days: 13 },
  { id: "30d", label: "Last 30 days", days: 29 },
] as const;

export type DatePresetId = (typeof DATE_PRESETS)[number]["id"];
