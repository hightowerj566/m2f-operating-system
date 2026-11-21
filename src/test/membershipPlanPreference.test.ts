import { beforeEach, describe, expect, it } from "vitest";
import { normalizeMembershipPlan, readPreferredMembershipPlan, savePreferredMembershipPlan } from "@/lib/membershipPlanPreference";

describe("membership plan preference", () => {
  beforeEach(() => localStorage.clear());

  it("defaults a new visitor to annual billing", () => {
    expect(readPreferredMembershipPlan()).toBe("annual");
  });

  it("remembers a monthly choice on the same device", () => {
    expect(savePreferredMembershipPlan("monthly")).toBe(true);
    expect(readPreferredMembershipPlan()).toBe("monthly");
  });

  it("rejects unknown plan values", () => {
    expect(normalizeMembershipPlan("performance")).toBeNull();
    expect(normalizeMembershipPlan(null)).toBeNull();
  });
});
