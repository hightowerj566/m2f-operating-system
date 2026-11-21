import type { MembershipPlan } from "@/lib/subscriptionTiers";

const MEMBERSHIP_PLAN_KEY = "m2f-membership-plan";

export function normalizeMembershipPlan(value: string | null | undefined): MembershipPlan | null {
  return value === "annual" || value === "monthly" ? value : null;
}

export function readPreferredMembershipPlan(): MembershipPlan {
  if (typeof window === "undefined") return "annual";
  try {
    return normalizeMembershipPlan(window.localStorage.getItem(MEMBERSHIP_PLAN_KEY)) ?? "annual";
  } catch {
    return "annual";
  }
}

export function savePreferredMembershipPlan(plan: MembershipPlan): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(MEMBERSHIP_PLAN_KEY, plan);
    return true;
  } catch {
    return false;
  }
}
