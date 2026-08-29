import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { z } from "zod";
import { toast } from "sonner";
import { ArrowRight, Loader2, PanelsTopLeft, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { roleHome } from "@/hooks/use-session";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — TeamPulse" },
      {
        name: "description",
        content: "Sign in to TeamPulse to submit daily updates and track team operations in real time.",
      },
      { property: "og:title", content: "Sign in — TeamPulse" },
      {
        property: "og:description",
        content: "Access your TeamPulse operations console.",
      },
    ],
  }),
  component: AuthPage,
});

const credentials = z.object({
  email: z.string().trim().email("Enter a valid work email").max(255),
  password: z.string().min(8, "Password must be at least 8 characters").max(72),
});

const signUpSchema = credentials.extend({
  fullName: z.string().trim().min(2, "Enter your full name").max(80),
});

function safeNext(value: string | null): string | null {
  if (!value) return null;
  return value.startsWith("/") && !value.startsWith("//") ? value : null;
}

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<"password" | "google" | null>(null);
  const [checking, setChecking] = useState(true);
  const [form, setForm] = useState({ email: "", password: "", fullName: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const nextPath =
    typeof window !== "undefined" ? safeNext(new URLSearchParams(window.location.search).get("next")) : null;

  useEffect(() => {
    let active = true;
    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      if (data.session) await routeAfterLogin();
      else setChecking(false);
    })();
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function routeAfterLogin() {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return;
    await supabase.rpc("ensure_profile");
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userData.user.id);
    const rank = ["manager", "team_lead", "team_member"] as const;
    const role = rank.find((r) => (roles ?? []).some((x) => x.role === r)) ?? "team_member";
    void navigate({ to: nextPath ?? roleHome(role), replace: true });
  }

  async function handlePassword(mode: "signin" | "signup") {
    setErrors({});
    const schema = mode === "signup" ? signUpSchema : credentials;
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      const flat: Record<string, string> = {};
      for (const issue of parsed.error.issues) flat[String(issue.path[0])] = issue.message;
      setErrors(flat);
      return;
    }
    setLoading("password");
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email: form.email.trim(),
          password: form.password,
          options: {
            emailRedirectTo: `${window.location.origin}${nextPath ?? "/"}`,
            data: { full_name: form.fullName.trim() },
          },
        });
        if (error) throw error;
        toast.success("Account created", { description: "You can sign in now." });
        const { data } = await supabase.auth.getSession();
        if (data.session) await routeAfterLogin();
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: form.email.trim(),
          password: form.password,
        });
        if (error) throw error;
        await routeAfterLogin();
      }
    } catch (error) {
      toast.error("Authentication failed", {
        description: error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setLoading(null);
    }
  }

  async function handleGoogle() {
    setLoading("google");
    if (nextPath) sessionStorage.setItem("teampulse:next", nextPath);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      setLoading(null);
      toast.error("Google sign-in failed", { description: "Please try again." });
      return;
    }
    if (result.redirected) return;
    await routeAfterLogin();
  }

  if (checking) {
    return (
      <div className="grid min-h-screen place-items-center">
        <Loader2 className="text-muted-foreground h-6 w-6 animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="bg-sidebar relative hidden flex-col justify-between p-10 lg:flex">
        <Link to="/" className="flex items-center gap-2.5">
          <span className="bg-primary text-primary-foreground grid h-9 w-9 place-items-center rounded-lg">
            <PanelsTopLeft className="h-4 w-4" />
          </span>
          <span className="text-base font-semibold">TeamPulse</span>
        </Link>
        <div className="max-w-md space-y-4">
          <h2 className="text-3xl leading-tight font-semibold">
            Every update, incident and call — visible the moment it happens.
          </h2>
          <p className="text-muted-foreground text-sm">
            TeamPulse turns scattered daily standups into a live operations record your managers and
            leads can act on.
          </p>
          <ul className="text-muted-foreground space-y-2 text-sm">
            {[
              "Structured daily updates in under two minutes",
              "Incident and call tracking with severity insight",
              "Role-aware dashboards for members, leads and managers",
            ].map((line) => (
              <li key={line} className="flex items-start gap-2">
                <ShieldCheck className="text-primary mt-0.5 h-4 w-4 shrink-0" />
                {line}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-muted-foreground text-xs">Secure role-based access · Real-time sync</p>
      </div>

      <div className="flex items-center justify-center p-6">
        <div className="w-full max-w-sm">
          <div className="mb-6 lg:hidden">
            <span className="bg-primary text-primary-foreground mb-3 grid h-9 w-9 place-items-center rounded-lg">
              <PanelsTopLeft className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-semibold">TeamPulse</h1>
          </div>

          <Tabs defaultValue="signin">
            <TabsList className="mb-5 grid w-full grid-cols-2">
              <TabsTrigger value="signin">Sign in</TabsTrigger>
              <TabsTrigger value="signup">Create account</TabsTrigger>
            </TabsList>

            <TabsContent value="signin" className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Welcome back</h2>
                <p className="text-muted-foreground text-sm">Sign in to your operations console.</p>
              </div>
              <Fields form={form} setForm={setForm} errors={errors} />
              <Button
                className="w-full"
                onClick={() => handlePassword("signin")}
                disabled={loading !== null}
              >
                {loading === "password" ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ArrowRight className="mr-2 h-4 w-4" />
                )}
                Sign in
              </Button>
            </TabsContent>

            <TabsContent value="signup" className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Create your account</h2>
                <p className="text-muted-foreground text-sm">New accounts start as team members.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fullName">Full name</Label>
                <Input
                  id="fullName"
                  value={form.fullName}
                  maxLength={80}
                  onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
                  placeholder="Alex Morgan"
                />
                {errors.fullName && <p className="text-destructive text-xs">{errors.fullName}</p>}
              </div>
              <Fields form={form} setForm={setForm} errors={errors} />
              <Button
                className="w-full"
                onClick={() => handlePassword("signup")}
                disabled={loading !== null}
              >
                {loading === "password" && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create account
              </Button>
            </TabsContent>
          </Tabs>

          <div className="my-5 flex items-center gap-3">
            <span className="bg-border h-px flex-1" />
            <span className="text-muted-foreground text-xs">or</span>
            <span className="bg-border h-px flex-1" />
          </div>

          <Button variant="outline" className="w-full" onClick={handleGoogle} disabled={loading !== null}>
            {loading === "google" ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <GoogleMark />
            )}
            Continue with Google
          </Button>

          <p className="text-muted-foreground mt-6 text-center text-xs">
            By continuing you agree to your organisation's acceptable use policy.
          </p>
        </div>
      </div>
    </div>
  );
}

function Fields({
  form,
  setForm,
  errors,
}: {
  form: { email: string; password: string; fullName: string };
  setForm: React.Dispatch<React.SetStateAction<{ email: string; password: string; fullName: string }>>;
  errors: Record<string, string>;
}) {
  return (
    <>
      <div className="space-y-1.5">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          maxLength={255}
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          placeholder="you@company.com"
        />
        {errors.email && <p className="text-destructive text-xs">{errors.email}</p>}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          maxLength={72}
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          placeholder="••••••••"
        />
        {errors.password && <p className="text-destructive text-xs">{errors.password}</p>}
      </div>
    </>
  );
}

function GoogleMark() {
  return (
    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.4a5.5 5.5 0 0 1-2.4 3.6v3h3.9c2.3-2.1 3.6-5.2 3.6-8.8z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.2 0 5.9-1.1 7.9-2.9l-3.9-3c-1.1.7-2.4 1.2-4 1.2-3.1 0-5.7-2.1-6.6-4.9H1.4v3.1A12 12 0 0 0 12 24z"
      />
      <path fill="#FBBC05" d="M5.4 14.4a7.2 7.2 0 0 1 0-4.6V6.7H1.4a12 12 0 0 0 0 10.8l4-3.1z" />
      <path
        fill="#EA4335"
        d="M12 4.8c1.8 0 3.4.6 4.6 1.8l3.4-3.4C17.9 1.2 15.2 0 12 0A12 12 0 0 0 1.4 6.7l4 3.1C6.3 6.9 8.9 4.8 12 4.8z"
      />
    </svg>
  );
}
