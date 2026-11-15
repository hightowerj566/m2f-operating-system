import { describe, expect, it } from "vitest";
import { MEMBERSHIP } from "@/lib/subscriptionTiers";

describe("public membership offer", () => {
  it("offers annual billing at $24.99 per month", () => {
    expect(MEMBERSHIP.annual.per_month).toBe(24.99);
  });

  it("offers monthly billing at $29.99 per month", () => {
    expect(MEMBERSHIP.monthly.per_month).toBe(29.99);
  });

  it("includes a 7-day free trial", () => {
    expect(MEMBERSHIP.trial_days).toBe(7);
  });
});
