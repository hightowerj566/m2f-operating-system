
# Programs Tab Redesign

Rebuild the Workout tab into a single Programs experience that presents one guided journey (pregnancy → post-birth → father athlete) and cleanly overrides only the training portion when a coach assigns a custom program. Keep every other M2F feature (missions, countdown, readiness, nutrition, lessons, roadmap) intact.

## Guiding principles

- The member never picks a training program. The phase engine decides.
- A coach assignment overrides only the training lane, nothing else.
- Every workout has three durations (Full / Express / Minimum) that preserve the objective — only time changes.
- The screen must answer five questions at a glance: what program, what today, how am I progressing, what's next, what did my coach say.

## Ship plan (phased)

Ship the member experience first. Coach Builder is a separate second phase so we're not blocked on it.

### Phase 1 — Member Programs experience (this build)

1. **Programs home (route `/programs`, replaces the Workout tab)**
   - Hero "Current Program" card: stage name, week X of Y, progress bar, live pregnancy week or baby age, Coach badge when applicable.
   - Primary CTA: **Start Today's Workout**.
   - Secondary CTAs: View Week · Program Details · Coach Notes (only when coach-assigned).
   - Below hero: weekly schedule row (Mon–Sun) with per-day state (Completed ✓ + date/time · Today · Locked until <date>).
   - Below schedule: journey timeline strip — Foundation → Framing → Durability → Mission Mode → Survival → Foundation → Father Athlete, with ✓ / Current / Upcoming / Locked states.

2. **Workout detail (route `/programs/workout/:day`)**
   - Version switcher tabs: **Full · Express · Minimum**. Switching preserves the workout, only exercises/duration change.
   - Header: objective, movement patterns, target RPE, mesocycle + deload badge, this week's progression rule ("Add 1 rep" / "+5 lb" / "Hold load").
   - Exercise list with sets, reps, rest, tempo, RIR/RPE, cue, substitutions, video link slot.
   - Smart Recommendation banner at top (low sleep → Express; missed yesterday → catch-up; 3 hard sessions → recovery). Dismissible, never blocking.
   - Complete button writes to existing `workout_logs` + `workout_feedback` and marks the day complete; also records which version was used.

3. **Stage overview page (route `/programs/stage/:slug`)**
   - Purpose, frequency, weekly split, nutrition target, recovery emphasis, expected outcome, duration.
   - One card per M2F stage (Foundation, Framing, Durability, Mission Mode, Survival, New Dad Foundation, Father Athlete).

4. **Journey / phase engine**
   - Consolidate stage selection in `src/lib/programJourney.ts`:
     - Inputs: `due_date`, `baby_arrived_at`, pregnancy week, coach assignment.
     - Output: `{ track: "guided" | "coach", stage, week, program, todayWorkout }`.
   - Pre-birth stages read from `src/content/preBirthTraining.ts`, post-birth from `src/content/postBirthTraining.ts` (already in the repo).
   - Coach lane reads from the existing `programs` + `program_days` + `program_assignments` tables.

5. **Nav**
   - Rename the "Workout" bottom-nav tab to **Programs**; route it to `/programs`.
   - Remove the manual Switch Program button — the picker is no longer member-facing.
   - Members can still open the picker only when they explicitly have zero assignment and no due date (fallback).

### Phase 2 — Coach Builder (separate follow-up)

Not built in this pass. Architecture below is designed so Phase 2 slots in without a rewrite:

- Coach Program Builder page: create / duplicate / edit / archive programs, save templates.
- Per-workout Full / Express / Minimum authoring, with auto-generation for empty Express/Minimum (strip accessories; keep primary patterns).
- Assign Program flow: member, start date, duration, deload schedule, auto-progress, lock editing, notes.
- Coach dashboard columns: current week, program, last workout, streak, missed, avg completion %, avg session length, weight trend, readiness, notes; flag clients needing attention.

Phase 1 already writes `version_used` on completion so coach-side adherence charts (Full/Express/Minimum split) work the day the dashboard ships.

## Data model

Additive only in Phase 1. No breaking changes.

- **New table `member_program_state`** — one row per user, source of truth for the resolved journey.
  - `user_id` (PK, FK auth.users), `track` (`guided`|`coach`), `stage_slug`, `current_week`, `mesocycle`, `is_deload_week`, `progression_target`, `program_id` (nullable, set for coach lane), `last_recomputed_at`.
  - RLS: user reads/updates own row; service_role writes from the recompute path; coaches can read rows for their assigned clients.
  - Recomputed on read from a `resolveJourney(user)` helper — the row is a cache, not the truth.
- **New table `workout_completions`** — `user_id`, `stage_slug`, `program_id` (nullable), `day_index`, `version_used` (`full`|`express`|`minimum`), `completed_at`, `duration_min`, `notes`.
  - Powers the weekly-schedule ✓ marks, streak, and Full/Express/Minimum adherence split.
- Reuse existing `program_assignments` for coach assignments. When an active assignment exists, `resolveJourney` sets `track = "coach"` and mirrors the values.

Every new table ships with the required `GRANT` + RLS in the same migration.

## File map

- `src/pages/Programs.tsx` — new home screen (replaces Workout tab UI).
- `src/pages/ProgramWorkout.tsx` — new workout detail with version switcher (replaces `PostBirthWorkout.tsx` — same shape, broader).
- `src/pages/ProgramStage.tsx` — new stage overview.
- `src/components/programs/HeroCard.tsx`, `WeekStrip.tsx`, `JourneyTimeline.tsx`, `VersionSwitcher.tsx`, `SmartRecommendationBanner.tsx`, `ProgressionCallout.tsx`, `CoachNotesCard.tsx`.
- `src/lib/programJourney.ts` — phase engine (pure, unit-tested).
- `src/lib/smartRecommendation.ts` — pure recommender for Full/Express/Minimum + catch-up.
- `src/hooks/useMemberProgram.ts` — resolves current program + today's workout.
- `src/content/journeyStages.ts` — stage metadata (purpose, frequency, split, nutrition, recovery, outcome, duration).
- `src/components/BottomNav.tsx` — rename tab to Programs, route to `/programs`.
- `src/App.tsx` — register new routes.
- Migration file — add `member_program_state`, `workout_completions`, grants, RLS.
- Tests — `programJourney.test.ts`, `smartRecommendation.test.ts`.

## What ships in Phase 1

- New `/programs` home, `/programs/workout/:day`, `/programs/stage/:slug`.
- Guided journey lane fully wired to pre-birth + post-birth content already in the repo.
- Coach lane rendered when an active `program_assignments` row exists (using the coach's existing programs).
- Full / Express / Minimum switching on every workout, with version tracked on completion.
- Weekly strip, journey timeline, progression callout, smart-recommendation banner.
- Bottom-nav renamed to Programs.

## What is intentionally deferred

- Coach Builder UI, templates, assignment wizard, auto-generated Express/Minimum for coach-authored workouts.
- Coach dashboard adherence charts (data starts landing today; UI ships with Phase 2).
- AI programming, equipment/travel/home modes, marketplace, leaderboards, community programs.
