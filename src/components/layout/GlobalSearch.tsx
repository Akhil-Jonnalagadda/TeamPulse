import { useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

interface Hit {
  id: string;
  label: string;
  sub: string;
  to: string;
  group: string;
}

export function GlobalSearch() {
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const q = term.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    let active = true;
    const timer = setTimeout(async () => {
      const like = `%${q}%`;
      const [people, incidents, learnings, analyses, apps] = await Promise.all([
        supabase.from("profiles").select("id, full_name, email").ilike("full_name", like).limit(5),
        supabase
          .from("incidents")
          .select("id, incident_number, title, severity")
          .or(`title.ilike.${like},incident_number.ilike.${like}`)
          .limit(5),
        supabase.from("learnings").select("id, title, technology").ilike("title", like).limit(4),
        supabase.from("analyses").select("id, title, reference_ticket").ilike("title", like).limit(4),
        supabase.from("applications").select("id, name, criticality").ilike("name", like).limit(4),
      ]);
      if (!active) return;
      const next: Hit[] = [
        ...(people.data ?? []).map((p) => ({
          id: `p-${p.id}`,
          label: p.full_name,
          sub: p.email,
          to: `/team/member/${p.id}`,
          group: "People",
        })),
        ...(incidents.data ?? []).map((i) => ({
          id: `i-${i.id}`,
          label: `${i.incident_number} · ${i.title}`,
          sub: `Severity ${i.severity}`,
          to: "/incidents",
          group: "Incidents",
        })),
        ...(analyses.data ?? []).map((a) => ({
          id: `a-${a.id}`,
          label: a.title,
          sub: a.reference_ticket ?? "Analysis",
          to: "/analysis",
          group: "Analyses",
        })),
        ...(learnings.data ?? []).map((l) => ({
          id: `l-${l.id}`,
          label: l.title,
          sub: l.technology ?? "Learning",
          to: "/learning",
          group: "Learning",
        })),
        ...(apps.data ?? []).map((a) => ({
          id: `ap-${a.id}`,
          label: a.name,
          sub: `${a.criticality} criticality`,
          to: "/applications",
          group: "Applications",
        })),
      ];
      setHits(next);
    }, 220);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [term]);

  const groups = [...new Set(hits.map((h) => h.group))];

  return (
    <>
      <Button
        variant="outline"
        onClick={() => setOpen(true)}
        className="text-muted-foreground h-9 w-full justify-start gap-2 px-3 text-sm font-normal sm:w-72"
      >
        <Search className="h-4 w-4" />
        <span className="hidden sm:inline">Search people, incidents, tickets…</span>
        <span className="sm:hidden">Search</span>
        <kbd className="bg-muted ml-auto hidden rounded px-1.5 py-0.5 text-[10px] font-medium sm:inline">
          ⌘K
        </kbd>
      </Button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search employees, incidents, tickets, analyses…"
          value={term}
          onValueChange={setTerm}
        />
        <CommandList>
          <CommandEmpty>
            {term.length < 2 ? "Type at least two characters." : "No matches found."}
          </CommandEmpty>
          {groups.map((g) => (
            <CommandGroup key={g} heading={g}>
              {hits
                .filter((h) => h.group === g)
                .map((h) => (
                  <CommandItem
                    key={h.id}
                    value={`${h.label} ${h.sub}`}
                    onSelect={() => {
                      setOpen(false);
                      setTerm("");
                      void navigate({ to: h.to });
                    }}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm">{h.label}</p>
                      <p className="text-muted-foreground truncate text-xs">{h.sub}</p>
                    </div>
                  </CommandItem>
                ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
