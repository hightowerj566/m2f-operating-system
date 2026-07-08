Apply the uploaded "M2F Readiness Slices 0+1" drop (Option B — zip).

## Steps

1. Extract `m2f-readiness-changed-files.zip` over the repo root, writing/overwriting these 12 files:
   - `supabase/migrations/20260708120000_m2f_readiness_core.sql` (new)
   - `supabase/functions/submit-quiz-lead/index.ts` (overwrite)
   - `src/lib/readiness.ts` (new)
   - `src/hooks/useReadiness.ts` (new)
   - `src/components/ReadinessRing.tsx` (new)
   - `src/components/tabs/HomeTab.tsx` (new)
   - `src/components/tabs/MoreTab.tsx` (overwrite)
   - `src/pages/ScoreReveal.tsx` (new)
   - `src/pages/FatherAthleteQuiz.tsx` (overwrite — repurposed as Readiness Assessment)
   - `src/pages/Index.tsx` (overwrite — adds Home as default tab)
   - `src/App.tsx` (overwrite — adds `/readiness` and `/score-reveal` routes)
   - `src/test/readiness.test.ts` (new)

2. Delete the two legacy files the drop replaces (per APPLY-INSTRUCTIONS):
   - `src/pages/ArchetypeReveal.tsx`
   - `src/pages/FatherAthleteResults.tsx`

3. Run the migration via the Supabase migration tool so the new tables (readiness categories, assessment CMS, `assessments`, profile `due_date`/`baby_arrived_at`/`baby_name`, lead score columns) exist with RLS + GRANTs. Migration is authored to include RLS; verify GRANTs are present and add any missing ones before running.

4. Verify: typecheck + run the new `src/test/readiness.test.ts` (author claims 11/11 passing).

## Notes / risks

- The overwrites to `Index.tsx`, `App.tsx`, `MoreTab.tsx`, and `FatherAthleteQuiz.tsx` are full-file replacements from the drop — any local edits in those files will be lost. Given this is a fresh remix, that should be fine.
- Route change: `/father-athlete-quiz` flow is replaced by `/readiness` → `/score-reveal`. Any external links pointing at the old archetype results page will break.
- Edge function `submit-quiz-lead` will auto-redeploy on push.
- Secrets (Stripe, Gemini) are unrelated to this drop and can be updated later as you noted.