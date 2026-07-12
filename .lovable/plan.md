# Live Program Schedule — Forge & Rebuild

Rebuild the training-program system so members follow a live calendar, not a self-serve list of every week. Only two programs use this layout: **Forge** and **Rebuild**.

---

## What the member sees

- One week at a time, centered on today's date.
- Header: program name, "Week X of Y", date range, workouts completed / remaining this week.
- Prev / Next arrows limited to the accessible range.
- Up to 4 previous weeks are browsable. Older weeks disappear from navigation (data is kept).
- Next week shows a locked card with unlock date and short message — no exercises, no titles.
- Unlock happens at **12:00 AM Sunday in the member's timezone**, enforced on the backend.

## What the coach sees

- Scheduler per member: assign Forge or Rebuild, pick start date, view weekly timeline.
- Per-week actions: edit dates, duplicate, replace, draft/publish, preview as member, pause, resume, end.
- Status chips: Draft · Scheduled · Current · Locked · Published · Completed · Paused.
- Publish ≠ Unlock. A published week stays locked until its scheduled Sunday.
- Full member history remains visible to the coach regardless of the 4-week member limit.

## Rules that must always hold

- Live calendar is the source of truth for "current week" — not workout completion.
- Missed workouts never delay the next unlock.
- Paused programs freeze unlocks; resume shifts future weeks forward, past weeks keep original dates.
- Member cannot reach future content via URL, API, client edits, phone-date changes, or another device.
- Deleting a member's view of old weeks never deletes their workout history.

---

## Technical section

### Data model (new / changed tables)

```text
program_assignments (extend existing)
  + scheduled_start_date date
  + scheduled_end_date   date
  + member_timezone      text     (IANA, e.g. America/Denver)
  + status               enum     draft|scheduled|active|paused|completed|ended
  + paused_at            timestamptz
  + resumed_at           timestamptz

scheduled_program_weeks (new)
  id, assignment_id, source_program_day_range (or week_id),
  display_week_number int,
  start_date date, end_date date,
  unlock_at timestamptz,          -- Sunday 00:00 in member tz, stored as UTC
  publish_status enum draft|published,
  access_status enum locked|unlocked|completed,
  coach_notes text, member_notes text

workout_completions (new or extend workout_logs)
  scheduled_week_id fk, workout_id, status, completed_at,
  performance jsonb, member_notes, coach_feedback

schedule_change_log (new)
  assignment_id, coach_id, field, prev_value jsonb, new_value jsonb,
  reason text, created_at
```

RLS: members see rows only where `unlock_at <= now()` AND `display_week_number >= current_week - 4`. Coaches (role check) see all rows. All enforcement in RLS + a security-definer helper `public.week_is_accessible(scheduled_week_id, user_id)`.

### Backend logic

- Postgres function `compute_unlock_at(start_date, week_number, tz)` → returns the Sunday-midnight UTC timestamp for that week in the member's timezone (handles DST).
- On assignment create: generate `scheduled_program_weeks` rows for all program weeks with `unlock_at` filled.
- Pause: set `status='paused'`, `paused_at=now()`, null out `unlock_at` for future weeks.
- Resume(new_start): recompute `unlock_at` and `start_date/end_date` for weeks after `paused_at`.
- Reschedule: write to `schedule_change_log` before mutating; never touch weeks with `access_status='completed'` unless admin action.

### Two programs

Seed **Forge** and **Rebuild** as the only programs flagged `uses_live_schedule = true`. Existing programs stay on legacy behavior so we don't break other members.

### Frontend

- New member view: `src/pages/Program.tsx` (replaces current program screen when program uses live schedule).
  - Header card, prev/next weekly nav, locked-week card, workout list for current week.
- Coach view: `src/pages/coach/ProgramScheduler.tsx` — assignment picker, weekly timeline, per-week edit sheet, preview-as-member toggle.
- Shared hooks: `useLiveSchedule(assignmentId)`, `useCurrentWeek(assignmentId)`.
- Mobile-first, one week visible, horizontal swipe within accessible range only.

### Tests (Vitest)

- unlock time math across DST boundaries and multiple timezones
- 4-week history window (5th week hidden, history preserved)
- future-week access blocked via direct fetch
- pause/resume shifts unlocks correctly
- missed workouts do not delay unlock

---

## Build order

1. Migration: extend `program_assignments`, add `scheduled_program_weeks`, `schedule_change_log`, enums, RLS, GRANTs, helper functions.
2. Seed Forge and Rebuild program shells + `uses_live_schedule` flag.
3. Assignment creation flow generates scheduled weeks.
4. Backend access helpers + RLS enforcement + tests.
5. Member weekly view + locked card.
6. Coach scheduler dashboard + preview-as-member.
7. Pause/resume + audit log UI.
8. Notifications hook points (fire on unlock, not on publish) — wired but delivery deferred.
9. Mobile QA on iPhone viewport.

---

## Scope check before I start

Two things worth confirming so I don't build the wrong thing:

1. **Program content** — Forge and Rebuild need actual weekly workouts. Do you want me to (a) create empty 12-week shells you and the coach fill later, (b) clone the existing M2F Perform content into both as a starting point, or (c) wait for you to provide the week-by-week programming?
2. **Legacy programs** — should existing members on M2F Perform / Everyday Dad keep the current unrestricted view, or migrate everyone to the live-schedule model?

Approve the plan (and answer those two) and I'll start with the migration.