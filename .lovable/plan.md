# Learn Tab — M2F Fatherhood Education Platform

Swap the Home "❤️ Coach" button for "📚 Learn" (Coach stays reachable via bottom-nav for coaches, and via /coach direct link). Build a full learning experience modeled after MasterClass × Apple Support × Notion.

## 1. Content architecture (all in-app, no backend needed)

New file: `src/content/learn/index.ts` — typed catalog:
- 7 Categories, each with slug, title, emoji, hero color, short description, list of lessons.
- Each Lesson: `id`, `slug`, `categorySlug`, `title`, `summary`, `minutes` (3–10), `pregnancyWeekRange` (for recommendations), `sections` (Overview, Why It Matters, Steps, Visual Examples, Common Mistakes, Safety Tips, Action Checklist, Key Takeaways), `related: string[]`.

Categories & lesson counts (~65 lessons total, seeded with rich copy — not lorem):
- 👶 Pregnancy & Baby Development (7)
- 🏥 Hospital Preparation (9)
- 👨‍🍼 Newborn Care (11)
- ❤️ Supporting Your Partner (10)
- 🏠 Preparing Your Home (8)
- 💰 Financial Preparation (7)
- 🧠 Becoming the Father You Want to Be (11)

Split across sibling files per category (`src/content/learn/pregnancy.ts`, etc.) to keep files reasonable, re-exported from `index.ts`.

## 2. Progress storage

New table `learn_progress` (Lovable Cloud):
```
id uuid pk, user_id uuid, lesson_slug text, completed_at timestamptz,
saved boolean default false, last_viewed_at timestamptz,
unique(user_id, lesson_slug)
```
RLS: user owns own rows. Grants to `authenticated` + `service_role`.

Hook: `src/hooks/useLearnProgress.ts` — returns `{ completed:Set, saved:Set, recent:Lesson[], toggleComplete, toggleSaved, markViewed, percentByCategory, overallPercent }`.

## 3. Routes & files

```
/learn                     → LearnHome
/learn/search              → LearnSearch
/learn/category/:slug      → CategoryHub
/learn/lesson/:slug        → LessonPage
```

New files:
- `src/pages/Learn.tsx` (Home)
- `src/pages/LearnCategory.tsx`
- `src/pages/LearnLesson.tsx`
- `src/pages/LearnSearch.tsx`
- `src/components/learn/LessonCard.tsx`
- `src/components/learn/CategoryTile.tsx`
- `src/components/learn/ProgressRing.tsx` (or reuse ReadinessRing)
- `src/hooks/useLearnProgress.ts`
- `src/content/learn/*.ts`

Route wiring in `src/App.tsx`.

## 4. Screens

### Learn Home (`/learn`)
Above the fold (mobile 390×622):
1. Header: "Learn" + overall completion ring (e.g. 24%) + search icon.
2. **Continue Learning** — one large card, last viewed lesson w/ resume CTA + progress bar in lesson.
3. **Recommended this week** — horizontal scroller of 3–5 lessons where `pregnancyWeekRange` includes current week (falls back to Foundation if no due date).

Below fold:
4. **Recently viewed** — horizontal row.
5. **Saved** — horizontal row (empty state prompts to bookmark).
6. **Categories** — 2-col grid of 7 tiles, each with emoji, title, `n/total` complete, thin progress bar.

### Category Hub (`/learn/category/:slug`)
- Hero: emoji, title, one-line "what you'll learn", category progress bar.
- List of lessons: title, 1-line summary, minutes, completed check, saved bookmark.

### Lesson Page (`/learn/lesson/:slug`)
Fixed section order rendered from `sections`:
1. Overview
2. Why It Matters
3. Step-by-Step (numbered)
4. Visual Examples (illustrated callout blocks — use styled cards, no external images)
5. Common Mistakes
6. Safety Tips (if present)
7. Action Checklist (interactive — checked state persists in localStorage per lesson)
8. Key Takeaways (bulleted)
9. Related Lessons (chips → navigate)
10. Sticky bottom bar: Save + Mark Complete.

On mount: `markViewed(slug)`.

### Search (`/learn/search`)
Fuzzy match on title/summary/keywords, grouped by category.

## 5. Home tab wiring

`src/components/tabs/HomeTab.tsx` Deeper Tools row:
- Rename `❤️ Coach` → `📚 Learn`, icon `BookOpen`, `onClick={() => navigate("/learn")}`.
- Remove the old duplicate `📚 Learn` (currently pointing to `/plan`) — replace it with something distinct or drop, keeping five buttons: 🍴 Nutrition · 💪 Programs · 📈 Readiness · ❤️ Her & Baby · 📚 Learn.
- Coaches keep bottom-nav Coach tab; direct `/coach` still works.

## 6. Design

- Reuse existing dark tokens; each category tile gets a soft accent tint via inline `style={{ backgroundImage: 'linear-gradient(...)' }}` on top of `bg-card/60 backdrop-blur border-white/5`.
- Large tap targets (min 56px), generous spacing, Instrument-Serif style headings already in project.
- No hardcoded `text-white` / `bg-black` — semantic tokens only.

## 7. Verification

- `bunx tsgo --noEmit`
- Playwright at 390×844: `/learn`, one category, one lesson — screenshot each, verify Mark Complete moves the ring.

Not in scope: AI tutoring, video, quizzes, certificates. Content is seeded plain-text; can expand later.
