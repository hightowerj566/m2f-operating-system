# Real Phase Locking + Home Restructure

Verified against the current code: `BuildList.tsx` line 77 does hard-code `unlocked = p.id === 6 ? fatherModeUnlocked : true`, so phases 1–5 never lock. `phases.ts` has no `startWeek`/`endWeek`, `surfaceMilestones` has no week argument, and `HomeTab.tsx` still surfaces a single "build" mission row.

## What changes

**Phase engine (`src/lib/phases.ts`)**
- Add machine-readable `startWeek` / `endWeek` to `Phase` and to all 5 pregnancy phases (4/14, 14/23, 23/32, 32/36, 36/43) plus Father Mode (40 / Infinity, unused for gating).
- Add `isPhaseUnlocked`, `phaseUnlockLabel`, `unlockedPhaseIds` and the `PhaseUnlockContext` type, placed after `phaseBrief()`.

**Surfacing (`src/hooks/useBuildList.ts`)**
- Rewrite `surfaceMilestones` to v3: new `currentPregnancyWeek` parameter, locked-phase filtering via `unlockedPhaseIds`, and the 8-bucket ranking (overdue critical → this-week → overdue → upcoming 1–2 weeks → current critical/standard/bonus → other unlocked phases). `useBuildList`, `useToggleMilestone`, `applyMilestoneBoost` untouched.

**Build Roadmap (`src/pages/BuildList.tsx`)**
- New `PhaseStatus` union with `upcoming-locked` / `father-mode-locked`; `unlockLabel` on `PhaseSummary`.
- Phase summaries computed from `isPhaseUnlocked`; locked phases expose no items, counts, or details.
- Locked phases can't expand, show "Unlocks at Week N" (or "Unlocks Day One"), and the `?task=` deep link no longer opens a locked phase.
- Celebration logic, `TaskSection`, `TaskRow`, `ProgressRing` unchanged.

**Home (`src/components/tabs/HomeTab.tsx` + 2 new components)**
- New `src/components/home/CoachFocusCard.tsx` — coach-assigned `weekly_priorities`, checkable, links to the weekly review. (Note: the existing `WeeklyFocusCard.tsx` covers similar data; the new card is the Home-prominent version per spec and the old one stays where it is.)
- New `src/components/home/ThisWeeksRoadmapCard.tsx` — up to 3 surfaced, unlocked milestones with a "View Full Roadmap" link.
- Both render as a new section directly above Today's Mission.
- Readiness boost now ignores locked-phase milestones; the "build" row, `buildEffectiveDone`, the per-day `build` override key, and the dead `nextMilestone` block are removed.

**Tests**
- New `src/test/phaseLocking.test.ts` (8 cases: startWeek gating, mid-pregnancy join, no-regression, overdue weeks, no due date, Father Mode independence, early arrival, labels).
- `src/test/readiness.test.ts`: the two `surfaceMilestones` tests are replaced by 8 week-aware ones matching the new signature.

## Technical notes

- The JSX in the request arrived with its tags stripped by the transport, so the two new components will be written as equivalent JSX using the project's existing semantic tokens (`bg-card`, `border-border`, `text-primary`, emerald success accents) and the exact copy, structure, handlers, and comments specified.
- Out of scope and untouched: `Plan.tsx`, `WeekReview.tsx`, `Coach.tsx`.
- After the edits: typecheck and run the full vitest suite, fixing any TS/lint fallout.

## Manual check after build

- `/build-list`: a not-yet-reached phase shows name, window and "Unlocks at Week N", and does not expand or reveal task titles/counts.
- Home: Coach Focus → This Week's Roadmap → Today's Mission, with no "Build list" row inside Today's Mission.
