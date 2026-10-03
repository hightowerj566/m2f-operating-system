# 1:1 Coaching Access

Invite links become 1:1 coaching invites. 1:1 clients get full app access without paying. Regular members pay through Stripe and get the app, nutrition included, but no human coaching. Coaches and admins start, pause, resume and end coaching from the existing Clients tab. Old coaching history is never deleted.

## Who gets access

```text
Coach/Admin                      -> full access
Active 1:1 client                -> full access + coaching (no Stripe needed)
Stripe active/trialing member    -> full app, nutrition, no human coaching
None of the above                -> normal membership page
```

## What changes

1. **Coaching status per client**: Active, Paused, Ended, or Not a 1:1 client. It also records the coach, the start date and the last change. Only coaches and admins can change it. Clients can read their own status but can't edit it.
2. **Invite links**: accepting an invite sets the client to 1:1 Active, linked to the inviting coach. Nobody gets the coach role from this.
3. **Existing clients**: everyone who already has an assigned coach or an accepted invite (about 8 people) starts as 1:1 Active. Nobody currently coached hits the paywall.
4. **Subscription check (server-side)**: the order is coach/admin, then active 1:1, then Stripe. The check also reports *why* someone has access (1:1 Coaching, Stripe Membership, both, Coach/Admin, or none).
5. **Database protection**: new weekly check-ins can only be created, and only reach the coach queue, while coaching is Active. A coach can't send new feedback or priorities to a client who isn't Active. Past check-ins, responses, priorities and flags stay readable.
6. **Member app**: weekly check-in prompts, the check-in status card, the coach review screens, coach focus/priorities and "Coach is reviewing your week" all show only for Active 1:1 clients. Nutrition tracking, logging, macros and history stay for every member. Only the coach's nutrition review card is limited to 1:1 clients.
7. **Coach Check-In Queue**: shows only Active 1:1 clients.
8. **Clients tab**:
   - Status badge: 1:1 Active / Paused / Ended / Not a 1:1 Client / Regular Member.
   - Buttons: Start 1:1 Coaching, Pause, Resume, End 1:1 Coaching (End asks for confirmation).
   - Access panel: M2F Access, Access Source, coach, start date.
   - Subscription panel (admins): Stripe status (Active / Trialing / Canceling / Canceled / Past Due / None), Monthly or Annual, price, start date, trial end, renewal date, and whether it cancels at period end. With no subscription it shows "Billing: Included with 1:1 Coaching". No card details are shown.
   - Warning badge when someone has an active Stripe subscription while 1:1 coaching is active. Nothing gets cancelled automatically.
9. **Coaching ends or pauses**: future check-ins stop, the client leaves the queue, nutrition stays, and history is kept. Access then comes from their Stripe membership if they have one. If not, they see the membership page. Resuming brings everything back, history included.

## Tests

Automated tests for the access rules, one per scenario:
- invited client
- normal signup
- active client with no Stripe
- active client with Stripe
- paused
- ended with Stripe
- ended without Stripe
- rejoins coaching
- regular member blocked from coaching
- regular member uses nutrition

The tests check the shared access-resolution logic and the database blocks on check-ins and the queue.

## Technical details

- Migration: add `coaching_status` (none/active/paused/ended, default none), `coaching_started_at`, `coaching_status_changed_at` to `profiles`. Add a `has_active_coaching(uuid)` security-definer function. Backfill to active where `assigned_coach_id` is set or an accepted invitation exists. Add a trigger that blocks non-coach/admin changes to the coaching columns and `assigned_coach_id`.
- RLS: `weekly_check_ins` insert/update requires `has_active_coaching(auth.uid())`. Inserts into `coach_weekly_responses` and `weekly_priorities` require the target client to be active. SELECT policies stay as they are, so history is still readable.
- `accept-invitation`: set `coaching_status='active'` and `coaching_started_at`.
- `check-subscription`: add the `has_active_coaching` bypass and return `access_source` and `coaching_status`. `useSubscription` exposes `isCoachingClient`.
- New edge function `set-coaching-status`: coach (assigned clients) or admin only; validated input.
- New edge function `client-access-details`: coach/admin only; returns a sanitized Stripe summary for one client (status, interval, amount, dates, cancel flag).
- UI gating in HomeTab, MacrosTab (NutritionReviewCard only), WeeklyCheckIn/WeeklyReview routes, CoachFocusCard/WeeklyFocusCard, and `useCoachCheckIns` filtered to active clients. Coach.tsx client rows get the badge, actions and panels.
- AGENTS.md: record the access resolution order rule.
