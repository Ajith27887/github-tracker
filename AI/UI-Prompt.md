UI for GitHub Tracker — Login, Profile Nav, Repo-Selectable Summary                                                                                                                     
                                                        
 Context

 The repo has a working Express backend (OAuth, repo sync, webhook ingest, Gemini summary) but the Next.js 16 frontend at /app is essentially empty — one unstyled landing page with a
 login button (app/page.tsx:1-30) and a bare root layout (app/layout.tsx:1-18). There is no nav, no auth state, no repo/summary UI, and the OAuth callback even redirects into a JSON
 endpoint (/auth/me) instead of back to the frontend.

 This plan wires up the end-to-end UX:
 1. User clicks Login with GitHub (button already exists).
 2. After OAuth, the nav shows their GitHub name + avatar (fallback to a dummy image).
 3. A repo selector lists the user's tracked repos (confirmed with user: repo selector only, not branch selector).
 4. User picks a repo and clicks Generate Summary — the existing Gemini pipeline runs against that repo's last-7-days events and the response is displayed.

 To support this the OAuth callback needs to start persisting the user's login / avatarUrl (currently fetched from GitHub and discarded, server/route/githubOAuth.ts:75-89), a new
 authed GET /user/me endpoint is needed (current GET /user/ returns all users including access tokens — not fixing that broader security issue here, just adding a safe alternative),
 and GET /summary needs to accept a repoId param instead of being hardcoded to "Ajith27887/github-tracker" (server/route/summary.ts:23).

 Out of scope (explicit non-goals)

 - Fixing GET /user/ and GET /event/ auth gaps — flagged but separate cleanup.
 - Git branch selection / capturing real per-commit branch in event.ts:68 (user chose repo-only selector).
 - Logout flow, filter-to-self-only, per-user event attribution — not requested.
 - Production CORS / session hardening (secure: false cookie, in-memory session store).

 Backend changes

 1. server/prisma/schema.prisma — add profile fields, relax email constraint

 Add to the User model (lines 9-17):
 login      String?  @unique
 avatarUrl  String?
 Both nullable so existing rows don't break.

 Also change email String @unique → email String? @unique. Today the OAuth callback writes "" when GitHub hides the user's email (very common) — the unique constraint then 500s the
 second time a user with a hidden email logs in. Postgres unique indexes allow multiple NULLs, so nullable email makes this go away. login + githubId are the real natural keys anyway.

 Run npx prisma migrate dev --name add_user_profile_fields from server/.

 2. server/route/githubOAuth.ts — persist profile + redirect to frontend

 At the upsert (lines 86-90), extend update and create to set name: userData.name ?? "", email: userData.email ?? null, login: userData.login, avatarUrl: userData.avatar_url. (Note:
 email is ?? null — not ?? "" — so nullable-unique works for the many GitHub users who hide their email. Requires step 1's schema change.) These fields are already in userData from the
  GitHub /user call at lines 75-80 — they're just being dropped today.

 At line 115, change the final redirect from http://localhost:3001/auth/me to http://localhost:3000/ so the browser lands back on the frontend with the session cookie set.

 3. server/route/userData.js — add authed /me

 Add a new handler before the existing GET / (which is insecure but left alone for now):
 route.get("/me", async (req, res) => {
   if (!req.session.userId) return res.status(401).json({ error: "Unauthorized" });
   const user = await prisma.user.findUnique({
     where: { id: req.session.userId },
     select: { id: true, name: true, login: true, avatarUrl: true },
   });
   if (!user) return res.status(404).json({ error: "Not found" });
   res.json(user);
 });
 No new mount needed — it'll be reachable at GET /user/me via the existing mount in server/server.js:35.

 4. server/route/summary.ts — accept ?repoId=N

 Replace the hardcoded lookup at lines 22-24 with:
 const repoId = Number(req.query.repoId);
 if (!repoId) return res.status(400).json({ error: "repoId required" });
 const allData = await prisma.repo.findFirst({
   where: { id: repoId, userId: req.session.userId },
 });
 if (!allData) return res.status(404).json({ error: "Repo not found" });
 The ownership check (userId: req.session.userId) is important — without it, any logged-in user could summarize any repo id. The rest of the handler (7-day window, Gemini call) stays
 as-is after the fixes from the prior turn.

 Frontend changes (Next.js 16.2.2, App Router)

 ▎ Per AGENTS.md this is Next.js 16 — read the relevant guide in node_modules/next/dist/docs/01-app/ before writing. Worth a scan of 01-app/02-guides/authentication.md for any
 ▎ 16-specific gotchas around client-component fetch + cross-origin cookies — the credentials: "include" + fetch pattern is expected to work but confirm before deep-debugging a silent
 ▎ session. Note also the unstable_instant hint in docs/index.md:11 for slow client-side navigation (not expected to bite here).

 5. app/globals.css (new) + app/layout.tsx — Tailwind + Nav

 Create app/globals.css:
 @import "tailwindcss";

 In app/layout.tsx (currently lines 1-18), import the CSS and render a <Nav /> above {children}. Keep it a Server Component; <Nav> itself is a Client Component.

 6. app/lib/api.ts (new) — shared fetch wrapper

 One tiny helper so every call sends the session cookie:
 const BASE = "http://localhost:3001";
 export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
   const res = await fetch(`${BASE}${path}`, { credentials: "include", ...init });
   if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
   return res.json();
 }

 7. app/components/Nav.tsx (new, "use client")

 On mount: api<{id,login,name,avatarUrl}>("/user/me").
 - On 401 → show the existing Login with GitHub button (same redirect as app/page.tsx:15: window.location.href = "http://localhost:3001/auth/").
 - On success → show <img src={user.avatarUrl ?? DUMMY_AVATAR} /> + {user.name || user.login}.
 - DUMMY_AVATAR = "https://www.gravatar.com/avatar/?d=mp&s=80" (Gravatar's standard mystery-person fallback — no extra asset needed).

 8. app/components/RepoSummary.tsx (new, "use client")

 - On mount (or when user is known): api<Repo[]>("/repo/") to populate a <select> of {repo.id → repo.repo}.
 - A Generate Summary button runs api<{summary: string, events: any[]}>("/summary/?repoId=" + selectedId) and renders the result in a <pre> or card. Handle isLoading, error.

 9. app/page.tsx — compose the dashboard

 Replace the current single login button with:
 export default function Home() {
   return <RepoSummary />; // Nav (in layout) handles login-vs-profile
 }
 If the user is not logged in, RepoSummary's /repo/ call returns 401 — render a "Please log in" hint. Auth gating lives in the Nav's login button rather than a route guard (simpler,
 fine for this scope).

 Files to create / modify — checklist

 Modify:
 - server/prisma/schema.prisma
 - server/route/githubOAuth.ts
 - server/route/userData.js
 - server/route/summary.ts
 - app/layout.tsx
 - app/page.tsx

 Create:
 - server/prisma/migrations/<timestamp>_add_user_profile_fields/ (via prisma migrate)
 - app/globals.css
 - app/lib/api.ts
 - app/components/Nav.tsx
 - app/components/RepoSummary.tsx

 Verification (end-to-end)

 1. cd server && npx prisma migrate dev --name add_user_profile_fields — migration applies cleanly.
 2. cd server && npm run dev — server starts on :3001.
 3. cd /home/ajith/personal/github-tracker && npm run dev — Next.js dev server on :3000.
 4. Open http://localhost:3000: Nav shows Login with GitHub button, page shows a "Please log in" hint.
 5. Click Login → GitHub OAuth flow → redirected back to http://localhost:3000/. Nav now shows avatar + name (or login).
 6. curl --cookie-jar /tmp/c -b /tmp/c http://localhost:3001/user/me (after grabbing the session cookie from the browser) returns {id, name, login, avatarUrl}.
 7. Repo selector on the page is populated from /repo/. Pick a repo that has ingested events → click Generate Summary → within a few seconds the summary text from Gemini appears.
 8. DB sanity: psql ... -c 'select id, name, login, "avatarUrl" from "User";' — the freshly-logged-in user has non-empty login and avatarUrl. (Prisma keeps camelCase column names, so
 "avatarUrl" needs the double quotes in psql.)
 9. Negative cases: without logging in, hitting /user/me returns 401; passing ?repoId= for a repo owned by another user returns 404.
