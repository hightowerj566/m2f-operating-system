import { describe, expect, it } from "vitest";
import { getCheckoutRequestBody, MEMBERSHIP } from "@/lib/subscriptionTiers";

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

  it("requests the annual membership by plan instead of a legacy price ID", () => {
    expect(getCheckoutRequestBody("annual")).toEqual({ plan: "annual" });
  });

  it("requests the monthly membership by plan instead of a legacy price ID", () => {
    expect(getCheckoutRequestBody("monthly")).toEqual({ plan: "monthly" });
  });

  it("preserves legacy price-ID checkout for existing paid-member upgrades", () => {
    expect(getCheckoutRequestBody("price_legacy")).toEqual({ price_id: "price_legacy" });
  });
});
