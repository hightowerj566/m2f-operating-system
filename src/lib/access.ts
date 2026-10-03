// Access resolution: coach/admin → active 1:1 coaching → Stripe membership.
// Mirrors supabase/functions/check-subscription (server is authoritative).

export type CoachingStatus = "none" | "active" | "paused" | "ended";
export type AccessSource = "coach_admin" | "coaching" | "coaching_and_stripe" | "stripe" | "none";

export interface AccessInput {
  isCoachOrAdmin: boolean;
  coachingStatus: CoachingStatus | null | undefined;
  stripeStatus: string | null | undefined; // active | trialing | past_due | canceled | null
}

export function hasStripeAccess(status: string | null | undefined): boolean {
  return status === "active" || status === "trialing";
}

export function resolveAccess(i: AccessInput) {
  const coaching = i.coachingStatus === "active";
  const stripe = hasStripeAccess(i.stripeStatus);
  let source: AccessSource = "none";
  if (i.isCoachOrAdmin) source = "coach_admin";
  else if (coaching && stripe) source = "coaching_and_stripe";
  else if (coaching) source = "coaching";
  else if (stripe) source = "stripe";
  return {
    hasAccess: source !== "none",
    source,
    coachingEnabled: coaching,
    nutritionEnabled: source !== "none",
    coachNutritionReview: coaching,
    duplicateBillingWarning: coaching && stripe,
  };
}

export const ACCESS_SOURCE_LABEL: Record<AccessSource, string> = {
  coach_admin: "Coach/Admin",
  coaching: "1:1 Coaching",
  coaching_and_stripe: "1:1 Coaching + Stripe Membership",
  stripe: "Stripe Membership",
  none: "No Active Access",
};

export const COACHING_STATUS_LABEL: Record<CoachingStatus, string> = {
  active: "1:1 Active",
  paused: "1:1 Paused",
  ended: "1:1 Ended",
  none: "Not a 1:1 Client",
};
