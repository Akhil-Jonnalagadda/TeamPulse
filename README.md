# TeamPulse
Live Link:: https://teampulse-operations.lovable.app
**Real-Time Team Operations & Daily Productivity Dashboard**

TeamPulse is a production-ready, full-stack web application for support and operations teams to capture daily work, track incidents, share learnings, and give managers real-time visibility into team productivity — all role-aware and live-updating.

## Features

### Roles
- **Team Member** — submit daily updates, manage personal incidents/calls/learnings, view own dashboard
- **Team Lead** — everything a member can do, plus team dashboard, update review (reviewed / needs clarification), comments, and team reports
- **Manager** — cross-team and cross-application visibility, org-wide analytics, and admin (teams, applications, role overview)

### Core workflows
- **Today's Update** — shift & hours overview plus structured sections: tasks, incidents, bridge calls, analysis, learnings, blockers, and tomorrow's plan
- **My Incidents / My Calls / My Learning** — personal record logs with triage steps, action items, search, filters, CSV export, and full add/edit/delete
- **Dashboards** — member, lead, and manager dashboards with KPIs, hours trends, incident severity mix, submission compliance, and per-member/per-team comparisons
- **Incidents, Calls, Analysis, Learning hubs** — org-wide browsing with charts, filters, and CSV export
- **Reports** — productivity, incident, and compliance reports with live preview and CSV download
- **Analytics** — "where time goes" breakdowns, incident trends, severity distribution, effort by category
- **Team & Applications** — roster with compliance tracking and an application catalogue with incident load
- **Realtime** — live activity feed, presence-based connection indicator, instant notification and dashboard updates via Postgres changes
- **Global search (⌘K)**, in-app notifications, dark/light/system theme, profile settings

## Tech stack

| Layer | Technology |
|---|---|
| Framework | TanStack Start v1 (React 19, SSR, server functions) |
| Build | Vite 7 |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Data fetching | TanStack Query |
| Charts | Recharts |
| Backend | Lovable Cloud (Postgres, Auth, Realtime, RLS) |
| Auth | Email/password + Google OAuth |

## Project structure

```text
src/
  routes/                 # file-based routes (public, /auth, _authenticated/*)
  components/
    layout/               # app shell, sidebar nav, global search, theme toggle
    charts/               # reusable chart wrappers
    common/               # badges, stat cards, toolbars, empty/error states
    forms/                # schema-driven entity dialogs
    records/              # shared "My Records" page component
    realtime/             # activity feed, realtime indicator
  hooks/                  # use-session, use-realtime
  lib/                    # constants, formatting/CSV helpers, shared queries
  integrations/supabase/  # generated client + typed database schema
supabase/
  migrations/             # schema, RLS policies, grants, seed data
```

## Database

16 tables (`teams`, `applications`, `profiles`, `user_roles`, `daily_updates`, `daily_tasks`, `incidents`, `incident_participants`, `calls`, `learnings`, `analyses`, `blockers`, `tomorrow_plans`, `notifications`, `activity_logs`, `manager_comments`) with:

- Row Level Security on every table, scoped by role (`has_role`), team membership (`can_view_user`), and ownership
- Explicit `GRANT`s for the Data API roles
- Realtime publication on operational tables for live dashboards
- Seed data: 2 teams, 5 applications, 13 demo users, 30 days of records

## Getting started

```bash
# install dependencies
bun install

# start the dev server
bun run dev
```

The app runs at `http://localhost:8080`. Sign up at `/auth` (email or Google) — a profile is provisioned automatically on first sign-in.

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Start dev server |
| `bun run build` | Production build |
| `bunx tsc --noEmit` | Type-check |

## Security notes

- Roles live in a dedicated `user_roles` table (never on the profile) and are checked via security-definer functions
- All protected data access goes through RLS — the browser client never bypasses it
- No secrets in client code; server-only values are read inside server function handlers

## Deployment

Publish directly from Lovable, or connect the project to GitHub (two-way sync) and deploy anywhere that supports the TanStack Start / Vite build output.
