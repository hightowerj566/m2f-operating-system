# Referral Codes and Monthly Payout Dashboard

## What members see
- Signup page gets an optional "Referral code" field. A shared link like `man2father.app/auth?mode=signup&ref=JOHN25` fills it in automatically.
- An invalid or inactive code shows a clear message; signup still works without a code.
- One referral code per new member, saved at signup and not changeable later by the member.

## What coaches/admins can do
- New "Referrals" screen in the coach area.
- Create a code for a person: their name, email/phone, the code (auto-suggested, editable), and the payout amount per paying member (default $10, editable per code).
- Copy the code or the share link; deactivate a code (past referrals stay recorded).
- Admins see all codes; coaches see the codes they created.

## When a referral counts
- Signup with a code = "Signed up" (tracked, not payable).
- The member's first real membership payment (after the 7-day trial) = "Eligible". Counts once per member; free trials, coaching invites, and refunds-before-payout do not create payouts.

## Monthly dashboard
- Month picker; per referrer: signups, trials, paying members, amount owed, amount paid.
- Drill-in list of referred members (name, signup date, first payment date, status).
- "Mark as paid" per referrer per month records date, amount, and who marked it. Paid records are locked and stay unchanged.
- CSV export for the month.

## Technical details
- Tables: `referral_codes` (code unique, case-insensitive, referrer info, payout_cents, created_by, is_active), `referrals` (referred_user_id unique, code_id, signed_up_at, first_paid_at, status), `referral_payouts` (code_id, month, amount_cents, paid_at, paid_by). GRANTs + RLS: coaches/admins only via `is_coach_or_admin`; members cannot read codes directly.
- Validation and attaching a code go through a security-definer function / edge function so codes can't be enumerated and members can't self-assign after signup.
- Code passed via signup metadata and attached server-side in `handle_new_user` (failures never block signup).
- `stripe-webhook`: on first `invoice.paid` with amount > 0 for a membership, set `first_paid_at` and status eligible (idempotent).
- Tests: code validation, one referral per member, eligibility only on first paid invoice (not trial), payout totals per month, paid records immutable.
