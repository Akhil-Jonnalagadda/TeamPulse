import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import {
  ChevronsLeft,
  ChevronsRight,
  LogOut,
  Menu,
  PanelsTopLeft,
  UserRound,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ScrollArea } from "@/components/ui/scroll-area";
import { UserAvatar } from "@/components/common/UserAvatar";
import { GlobalSearch } from "@/components/layout/GlobalSearch";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { NotificationPopover } from "@/components/notifications/NotificationPopover";
import { RealtimeIndicator } from "@/components/realtime/RealtimeIndicator";
import { navForRole } from "@/components/layout/nav-config";
import { roleHome, type AppRole, type Profile } from "@/hooks/use-session";
import { prettyDate, titleCase } from "@/lib/format";
import { cn } from "@/lib/utils";

function NavLinks({ role, onNavigate, collapsed }: { role: AppRole; onNavigate?: () => void; collapsed?: boolean }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="space-y-5 px-3 py-4" aria-label="Main">
      {navForRole(role).map((group) => (
        <div key={group.label}>
          {!collapsed && (
            <p className="text-muted-foreground/80 px-2 pb-1.5 text-[10px] font-semibold tracking-widest uppercase">
              {group.label}
            </p>
          )}
          <ul className="space-y-0.5">
            {group.items.map((item) => {
              const active = pathname === item.to || pathname.startsWith(`${item.to}/`);
              return (
                <li key={item.to}>
                  <Link
                    to={item.to}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "group flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm transition-all duration-150",
                      active
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium shadow-xs"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/60",
                      collapsed && "justify-center px-0",
                    )}
                  >
                    <item.icon
                      className={cn("h-4 w-4 shrink-0", active ? "text-sidebar-primary" : "text-muted-foreground")}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                    {active && !collapsed && (
                      <span className="bg-sidebar-primary ml-auto h-4 w-1 rounded-full" />
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function Brand({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className={cn("flex items-center gap-2.5 px-4 py-4", collapsed && "justify-center px-0")}>
      <span className="bg-primary text-primary-foreground grid h-8 w-8 place-items-center rounded-lg">
        <PanelsTopLeft className="h-4 w-4" />
      </span>
      {!collapsed && (
        <div className="leading-tight">
          <p className="text-sm font-semibold">TeamPulse</p>
          <p className="text-muted-foreground text-[11px]">Operations console</p>
        </div>
      )}
    </div>
  );
}

export function AppShell({
  profile,
  role,
  children,
}: {
  profile: Profile;
  role: AppRole;
  children: ReactNode;
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  }

  return (
    <div className="bg-background flex min-h-screen">
      <aside
        className={cn(
          "bg-sidebar border-sidebar-border sticky top-0 hidden h-screen shrink-0 flex-col border-r transition-[width] duration-200 lg:flex",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <Brand collapsed={collapsed} />
        <ScrollArea className="flex-1">
          <NavLinks role={role} collapsed={collapsed} />
        </ScrollArea>
        <div className="border-sidebar-border border-t p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={() => setCollapsed((v) => !v)}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-background/85 supports-[backdrop-filter]:bg-background/65 sticky top-0 z-30 border-b backdrop-blur">
          <div className="flex items-center gap-2 px-3 py-2.5 sm:px-5">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
                  <Menu className="h-4 w-4" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="bg-sidebar w-72 p-0">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <Brand />
                <ScrollArea className="h-[calc(100vh-4rem)]">
                  <NavLinks role={role} onNavigate={() => setMobileOpen(false)} />
                </ScrollArea>
              </SheetContent>
            </Sheet>

            <div className="min-w-0 flex-1">
              <GlobalSearch />
            </div>

            <span className="text-muted-foreground hidden text-xs xl:inline">{prettyDate(new Date())}</span>
            <div className="hidden md:block">
              <RealtimeIndicator />
            </div>
            <ThemeToggle />
            <NotificationPopover userId={profile.id} />

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="focus-visible:ring-ring rounded-full focus-visible:ring-2 focus-visible:outline-none" aria-label="Account menu">
                  <UserAvatar name={profile.full_name} src={profile.avatar_url} presence="online" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>
                  <p className="text-sm font-medium">{profile.full_name}</p>
                  <p className="text-muted-foreground truncate text-xs font-normal">{profile.email}</p>
                  <p className="text-primary mt-1 text-[11px] font-medium">{titleCase(role)}</p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate({ to: roleHome(role) })}>
                  <PanelsTopLeft className="mr-2 h-4 w-4" /> Dashboard
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate({ to: "/settings" })}>
                  <UserRound className="mr-2 h-4 w-4" /> Profile & settings
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                  <LogOut className="mr-2 h-4 w-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="mx-auto w-full max-w-[1600px] flex-1 space-y-5 p-3 sm:p-5">{children}</main>
      </div>
    </div>
  );
}
