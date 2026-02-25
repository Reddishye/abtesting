# ABPlatform — A/B Script Injection Platform

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| UI | React 19, Tailwind CSS v4, shadcn/ui (New York / Neutral) |
| Database / Auth | Supabase (Postgres + Auth) |
| Editor | Monaco Editor |
| Package manager | Bun |
| Deploy | Vercel |

---

## Project Structure

```
app/
  (auth)/           Login, signup, invite acceptance
  (onboarding)/     Org creation wizard
  (dashboard)/      Main app — scripts, experiments, team
  p/[id]/           Public script endpoint (Edge runtime, CORS open)
  e/[id]/           Experiment variant endpoint (Edge runtime, CORS open)
  api/
    events/         Event ingestion (public, CORS open)
    scripts/[id]/   Script fetch API for the editor client
    invites/        Invite validation and acceptance

components/

  editor/           Monaco editor + auto-save toolbar
  scripts/          Script table, publish dialog, version history
  experiments/      Experiment cards, weight slider, status control
  team/             Member table, invite form
  layout/           App sidebar, dashboard header
  shared/           Status badge, copy button, archive dialog, empty state
  ui/               shadcn/ui primitives

lib/
  supabase/         Browser, server, admin clients + session middleware
  actions/          Server actions (auth, scripts, experiments, team)
  queries/          Cached server-only data helpers
  types/            TypeScript DB interfaces
  utils/            cn, experiment variant selection, URL builders
```

---

## Environment Variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` | Supabase anon/publishable key |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key (server-only, never exposed to client) |
| `NEXT_PUBLIC_APP_URL` | Full base URL of the app (e.g. `https://yourapp.com`) |

---

## Architecture

### Multi-tenancy
Every resource (scripts, experiments, events, users) is scoped to an `org_id`. All server actions and data queries enforce `.eq('org_id', ...)` as the boundary. Supabase RLS policies provide a second enforcement layer at the DB level.

> !INFO
> This decision was made due to the need of future scalability. If the app needs/should be single-org, a simple policy can be done to get this result.

### Caching strategy

| Data | Cache layer | Invalidation |
|---|---|---|
| `getUser()` | React `cache()` (per-request) | N/A — always fresh Supabase auth check |
| `getUserProfile()` | React `cache()` + `unstable_cache` 5 min | `revalidateTag('profile:{id}', 'max')` on role change or member removal |
| `getScriptsByOrg` | `unstable_cache`, tag `scripts:{orgId}` | Any script mutation |
| `getExperimentsByOrg` | `unstable_cache`, tag `experiments:{orgId}` | Any experiment mutation |
| `getOrg()` | `unstable_cache`, tag `org:{orgId}` | Org update |
| Public scripts `/p/:id` | `Cache-Control: public, max-age=60, stale-while-revalidate=300` | Published scripts are immutable |
| Experiment loader `/e/:id` | `Cache-Control: public, max-age=300, stale-while-revalidate=600` | Loader contains no variant or user data |
| Variant assignment `/api/e/:id/assign` | `Cache-Control: no-store` | Must reflect current experiment status |

**Important:** `revalidatePath` alone does NOT bust `unstable_cache`. Always pair it with `revalidateTag(tag, 'max')` after mutations (the second argument is required in Next.js 16).

### Script versioning
Scripts follow an immutable publish model:
- `draft` — editable, not public
- `published` — public at `/p/{id}.js`, immutable (editing requires forking)
- `archived` — hidden from active views, read-only

Forking creates a new row with `parent_id` pointing to the root of the version tree. `getVersionHistory` queries `id = rootId OR parent_id = rootId`.

#### Remaining limitations

- **Incognito / private browsing:** `localStorage` is cleared when the private session ends. Each new private session gets a fresh random variant, which is expected behaviour.
- **Safari ITP 7-day cap:** Safari purges `localStorage` for domains the user has not visited directly within 7 days. For long-running experiments, the loader refreshes the localStorage entry on every page load (`setItem` on both first visit and return visit) to reset the timer.
- **SSR host pages:** If the host renders HTML server-side, the first server render does not have access to `localStorage`. The experiment script is injected after JS hydration, which means the control/variant difference only applies to client-rendered DOM changes — not server-rendered HTML. This is the same limitation as all tag-injection A/B tools (Google Optimize, Optimizely, etc.).

### Role-based permissions

| Action | viewer | editor | admin | owner |
|---|---|---|---|---|
| View scripts / experiments | ✓ | ✓ | ✓ | ✓ |
| Create / edit / publish scripts | ✗ | ✓ | ✓ | ✓ |
| Create / start / pause experiments | ✗ | ✓ | ✓ | ✓ |
| Archive scripts / experiments | ✗ | ✗ | ✓ | ✓ |
| Invite / remove members | ✗ | ✗ | ✓ | ✓ |
| Change member roles | ✗ | ✗ | ✗ | ✓ |

---

## Performance Decisions

1. **React `cache()` + `unstable_cache` stacking** — `getUserProfile` is deduplicated per-request AND cached for 5 minutes across requests, eliminating repeated DB hits on every page navigation.
2. **Parallel data fetching** — Pages use `Promise.all` for independent queries (e.g. scripts + experiments on the scripts list page; experiment data + stats on the detail page).
3. **COUNT queries** — Impression stats use `{ count: 'exact', head: true }` instead of fetching all event rows and counting in JS.
4. **N+1 elimination** — `getExperimentById` fetches both variant scripts in a single `.in('id', [...ids])` query instead of two separate calls.
5. **Route prefetching** — `AppSidebar` calls `router.prefetch()` for all nav routes on mount, making first-click navigation near-instant.
6. **`loading.tsx` skeletons** — Every major route has a skeleton UI that renders immediately while server data fetches stream in.
7. **Middleware exclusions** — `/p/*`, `/e/*`, and `/api/events` are excluded from the session-refresh middleware to reduce latency on the hot public endpoints.

---

## Security Model

### What is protected by design

- **All server actions** call `getAuthedUser()` first and return `{ error }` if unauthenticated.
- **All DB writes** include `.eq('org_id', ctx.profile.org_id)` — a user can never mutate another org's data even with a crafted request.
- **Admin client** (`SUPABASE_SERVICE_ROLE_KEY`) is only imported in server-only files. It bypasses RLS intentionally; org-scoping is enforced at the application layer.
- **Server actions are CSRF-safe** — Next.js server actions use the `Origin` header check and `SameSite=Strict` cookies by default.
- **Script publish is immutable** — Once published, a script's code cannot be changed. Only forking creates a new editable draft.
- **Invite tokens** are random UUIDs with 7-day expiry.

### Security headers

Applied to all dashboard and auth routes (excluded from public script/event endpoints which require cross-origin access):

| Header | Value |
|---|---|
| `X-Content-Type-Options` | `nosniff` |
| `X-Frame-Options` | `SAMEORIGIN` |
| `X-XSS-Protection` | `1; mode=block` |
| `Referrer-Policy` | `strict-origin-when-cross-origin` |
| `Permissions-Policy` | `camera=(), microphone=(), geolocation=()` |

# Technical Test // Not documentation

The following section is not part of the project documentation. Instead it is the process of the development, tradeoffs, ai usage and decisions taken during the development of the project. This section is here exclusively for the reviewer of the technical test, and should not be considered as part of the project documentation.

## Development Process

First all started sending my idea among with the PDF of the technical test to Perplexity (Claude Sonnet 4.6 Thinking) to try get an AI to review my plan and give me feedback, suggestions and improvements.

After securing the plan, I asked the same AI to give me the Supabase SQL code to create the database schema and setup the RLS policies. After getting the code, I reviewed it and made some adjustments to fit my needs and preferences (some details were not as I wanted, none of them were critical and was more a matter of style and preference).

After applying the SQL code to my Supabase instance, I started the development of the project. I started by researching a bit about how to use Supabase (was my first time using a BaaS platform without another backend in between) and how to integrate it with Next.js (I really didn't want to cause any security issues or publish any secret key to the client).

Right after that, I started creating a prompt for Claude Code (Opus 4.6) to generate the basic code for the project, so I could start with frontend directly without worrying about the connection with the backend.

When the basics of the code were generated, I started to implement features based on the priority for the MVP, since the database structure was already defined and ready to support all the features.
During frontend development, I did the key custom components while Claude was generating the usual pages like Login, Signup, Dashboard, etc. I also made some adjustments to the generated code when I thought it was necessary (like on the login page). 

After finishing the key features of the app I requested ~10 agents with different models (via Github Copilot) to review the code and give me feedback on how to improve it, and I applied the suggestions that I found relevant (like one regarding Safari third-party cookies).

Finally, I did some manual testing of the app, trying to find any bugs or edge cases that I might have missed during development, and fixed them when I found any (most of them were basically minor UI issues like label alignment).

## Tradeoffs and Decisions

- I had to choose between a instance-based app, a multi-tenant app with separate schemas, and a multi-tenant app with shared schema. I chose the last one because it is the most scalable and flexible option, and although is not the one I'm not more familiar with, Supabase made it easier than I expected.

- I had to choose how to process invites in a way that would not make an user be forced to join that organization, while also not making the process too complicated. The approach selected was to simplify the process of creating an account via an invite link.

- 