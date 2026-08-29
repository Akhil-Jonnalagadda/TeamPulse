import {
  Activity,
  AppWindow,
  BarChart3,
  Bell,
  BookOpen,
  CalendarCheck,
  ClipboardList,
  FileBarChart,
  FlaskConical,
  LayoutDashboard,
  PhoneCall,
  Settings,
  ShieldCheck,
  Users,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AppRole } from "@/hooks/use-session";

export interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  label: string;
  items: NavItem[];
}

export function navForRole(role: AppRole): NavGroup[] {
  if (role === "team_member") {
    return [
      {
        label: "Workspace",
        items: [
          { to: "/dashboard/member", label: "My Dashboard", icon: LayoutDashboard },
          { to: "/today", label: "Today's Update", icon: CalendarCheck },
          { to: "/updates", label: "My History", icon: ClipboardList },
        ],
      },
      {
        label: "My Records",
        items: [
          { to: "/incidents", label: "My Incidents", icon: Activity },
          { to: "/calls", label: "My Calls", icon: PhoneCall },
          { to: "/analysis", label: "My Analysis", icon: FlaskConical },
          { to: "/learning", label: "My Learning", icon: BookOpen },
        ],
      },
      {
        label: "Account",
        items: [
          { to: "/notifications", label: "Notifications", icon: Bell },
          { to: "/settings", label: "Profile", icon: Settings },
        ],
      },
    ];
  }

  const isManager = role === "manager";
  const groups: NavGroup[] = [
    {
      label: "Overview",
      items: [
        {
          to: isManager ? "/dashboard/manager" : "/dashboard/lead",
          label: "Dashboard",
          icon: LayoutDashboard,
        },
        { to: "/today", label: "Today's Update", icon: CalendarCheck },
        { to: "/updates", label: "Daily Updates", icon: ClipboardList },
        { to: "/team", label: "Team", icon: Users },
      ],
    },
    {
      label: "Operations",
      items: [
        { to: "/incidents", label: "Incidents", icon: Activity },
        { to: "/calls", label: "Calls", icon: PhoneCall },
        { to: "/analysis", label: "Analysis", icon: FlaskConical },
        { to: "/learning", label: "Learning Hub", icon: BookOpen },
        { to: "/applications", label: "Applications", icon: AppWindow },
      ],
    },
    {
      label: "Insight",
      items: [
        { to: "/reports", label: "Reports", icon: FileBarChart },
        { to: "/analytics", label: "Analytics", icon: BarChart3 },
        { to: "/notifications", label: "Notifications", icon: Bell },
      ],
    },
  ];

  groups.push({
    label: "System",
    items: [
      ...(isManager ? [{ to: "/admin", label: "Administration", icon: ShieldCheck }] : []),
      { to: "/settings", label: "Settings", icon: Settings },
    ],
  });

  return groups;
}
