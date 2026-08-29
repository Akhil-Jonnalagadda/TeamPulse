import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/layout/AppShell";
import { ErrorState } from "@/components/common/States";
import { Button } from "@/components/ui/button";
import { useCurrentUser } from "@/hooks/use-session";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      throw redirect({ to: "/auth", search: { next: location.href } as never });
    }
    return { user: data.user };
  },
  component: ProtectedLayout,
  errorComponent: () => <ErrorState message="This workspace page failed to load." />,
});

function ProtectedLayout() {
  const { ready, settled, profile, role, refetch } = useCurrentUser();

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading your workspace…
        </div>
      </div>
    );
  }

  if (!profile || !role) {
    return (
      <div className="grid min-h-screen place-items-center p-6">
        <div className="space-y-3 text-center">
          <ErrorState message="We couldn't finish setting up your workspace profile." />
          <Button onClick={() => void refetch()}>Try again</Button>
        </div>
      </div>
    );
  }

  return (
    <AppShell profile={profile} role={role}>
      <Outlet />
    </AppShell>
  );
}
