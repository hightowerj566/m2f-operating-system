## M2F Operating System — Home Redesign

### 1. Header (top of Home)
- Dark premium background with subtle blue/gold accent glow.
- M2F logo top-left, avatar top-right (link to profile/settings).
- Center label: "Man to Father Operating System" (small caps, muted gold).
- Greeting: "Good morning/afternoon/evening, {firstName}".
- Large countdown "73 DAYS" pulled from `profiles.due_date`.
- Subtext: "until everything changes".
- Identity line: "Your job today: become 1% more prepared than yesterday."

### 2. Three cards above the fold

**Card 1 — TODAY**
Rows (reads existing data):
- Workout — today's workout name (existing program hook)
- Daily Standards — `x / 5` complete
- Ask Her Tonight — today's prompt (existing)
- Build Task — next open Build List item
- Day Completion progress bar + %
- CTA: **Open Today** → `/today` tab

**Card 2 — PROGRESS**
- Father Readiness % (useReadiness)
- Change this week (delta)
- Standards streak (days)
- Workouts this week
- Build List completion %
- Conversations this month
- CTA: **View Progress** → `/progress` tab

**Card 3 — NEXT**
- Next milestone (e.g. "Week 32")
- Baby development / fatherhood phase (from `src/content/fatherhood.ts`)
- Current focus
- Days remaining
- CTA: **See Road Ahead** → `/her-and-baby`

### 3. Deeper Tools (below fold)
Compact icon buttons: Nutrition, Programs, Coach, Knowledge, Resources.

### 4. Bottom Nav (rebuilt)
Exactly four items:
- **Home** — new dashboard
- **Today** — merges Workout + Daily Standards + Mission + Ask Her Tonight into one screen
- **Progress** — Readiness + streaks + body + workouts + build list
- **More** — Macros/Nutrition, Programs, Coach, Settings, Subscription, Resources

### 5. Design tokens
- Reuse existing dark theme; add glass card variant (`bg-card/60 backdrop-blur border-white/5 rounded-2xl`).
- Blue (`--primary`) + gold (`--success`/amber) accents already in tokens.
- Large tap targets (min 56px), generous spacing, max 3 major decisions above fold.

### 6. Files to change
- `src/components/tabs/HomeTab.tsx` — full rewrite to new dashboard.
- New `src/components/tabs/TodayTab.tsx` — aggregates workout/standards/mission/ask-her.
- `src/components/tabs/ProgressTab.tsx` — keep, ensure new metrics surface.
- `src/components/tabs/MoreTab.tsx` — add Programs/Coach/Subscription/Resources entries.
- `src/pages/Index.tsx` — rebuild `baseNavItems` to Home/Today/Progress/More; wire Today tab; keep all existing routes intact.

### 7. Data (no schema changes)
All values sourced from existing Supabase tables/hooks: `profiles`, `daily_standards`, `workouts`, `build_list`, `useReadiness`, `useMissions`, `useM2fOs`, subscriptions, program assignment.

### 8. Audit step
After build, verify at 390×622 viewport that only header + 3 cards are visible above the fold; if not, tighten paddings.
