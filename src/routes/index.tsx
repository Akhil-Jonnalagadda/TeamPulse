import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Activity,
  ArrowRight,
  BarChart3,
  CalendarCheck,
  PanelsTopLeft,
  PhoneCall,
  ShieldCheck,
  Users,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { roleHome } from "@/hooks/use-session";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TeamPulse — Real-Time Team Operations Dashboard" },
      {
        name: "description",
        content:
          "TeamPulse captures daily updates, incidents, calls and learning in one live dashboard for support and operations teams.",
      },
      { property: "og:title", content: "TeamPulse — Real-Time Team Operations Dashboard" },
      {
        property: "og:description",
        content:
          "Structured daily updates, incident tracking and role-aware analytics for productive teams.",
      },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  {
    icon: CalendarCheck,
    title: "Daily updates in two minutes",
    body: "Tasks, hours, blockers and tomorrow's plan captured in one guided form.",
  },
  {
    icon: Activity,
    title: "Incident intelligence",
    body: "Severity, downtime and resolution time tracked from the first alert to RCA.",
  },
  {
    icon: PhoneCall,
    title: "Call & analysis logs",
    body: "Every client call, internal sync and root-cause analysis stays searchable.",
  },
  {
    icon: Users,
    title: "Role-aware dashboards",
    body: "Members see their day, leads see their team, managers see the whole floor.",
  },
  {
    icon: BarChart3,
    title: "Productivity analytics",
    body: "Trends for completion rate, workload balance and incident heat by application.",
  },
  {
    icon: ShieldCheck,
    title: "Secure by default",
    body: "Row-level security keeps every record scoped to the right person and team.",
  },
];

function Landing() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active || !data.session) return;
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", data.session.user.id);
      const rank = ["manager", "team_lead", "team_member"] as const;
      const role = rank.find((r) => (roles ?? []).some((x) => x.role === r)) ?? "team_member";
      setSignedIn(true);
      void navigate({ to: roleHome(role), replace: true });
    })();
    return () => {
      active = false;
    };
  }, [navigate]);

  return (
    <div className="bg-background min-h-screen">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-5 py-5">
        <div className="flex items-center gap-2.5">
          <span className="bg-primary text-primary-foreground grid h-9 w-9 place-items-center rounded-lg">
            <PanelsTopLeft className="h-4 w-4" />
          </span>
          <span className="text-base font-semibold">TeamPulse</span>
        </div>
        <Button asChild variant={signedIn ? "default" : "outline"} size="sm">
          <Link to="/auth">{signedIn ? "Open dashboard" : "Sign in"}</Link>
        </Button>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-5 pt-14 pb-16 text-center">
          <p className="text-primary bg-primary/8 ring-primary/15 inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-medium ring-1 ring-inset">
            <span className="bg-primary live-dot h-1.5 w-1.5 rounded-full" />
            Live team operations
          </p>
          <h1 className="mx-auto mt-5 max-w-3xl text-4xl leading-tight font-semibold tracking-tight sm:text-5xl">
            The daily pulse of your support and operations team
          </h1>
          <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-base">
            TeamPulse replaces scattered standup notes with a structured, real-time record of tasks,
            incidents, calls and learning — with dashboards built for each role.
          </p>
          <div className="mt-7 flex flex-wrap justify-center gap-3">
            <Button asChild size="lg">
              <Link to="/auth">
                Get started <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-20">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f) => (
              <article key={f.title} className="surface p-5">
                <span className="bg-accent text-accent-foreground mb-3 grid h-9 w-9 place-items-center rounded-lg">
                  <f.icon className="h-4 w-4" />
                </span>
                <h2 className="text-sm font-semibold">{f.title}</h2>
                <p className="text-muted-foreground mt-1.5 text-sm">{f.body}</p>
              </article>
            ))}
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="text-muted-foreground mx-auto max-w-6xl px-5 py-6 text-xs">
          TeamPulse · Real-time team operations & daily productivity
        </div>
      </footer>
    </div>
  );
}
