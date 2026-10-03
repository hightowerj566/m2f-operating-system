import { describe, it, expect } from "vitest";
import { resolveAccess } from "@/lib/access";

const base = { isCoachOrAdmin: false, coachingStatus: "none" as const, stripeStatus: null };

describe("access resolution", () => {
  it("invited (active 1:1) client without Stripe gets full access and coaching", () => {
    const r = resolveAccess({ ...base, coachingStatus: "active" });
    expect(r.hasAccess).toBe(true);
    expect(r.source).toBe("coaching");
    expect(r.coachingEnabled).toBe(true);
  });
  it("normal signup without Stripe has no access", () => {
    expect(resolveAccess(base).hasAccess).toBe(false);
  });
  it("trialing regular member has access, nutrition, but no coaching", () => {
    const r = resolveAccess({ ...base, stripeStatus: "trialing" });
    expect(r.hasAccess).toBe(true);
    expect(r.nutritionEnabled).toBe(true);
    expect(r.coachingEnabled).toBe(false);
    expect(r.coachNutritionReview).toBe(false);
  });
  it("active client with Stripe shows both sources and warns", () => {
    const r = resolveAccess({ ...base, coachingStatus: "active", stripeStatus: "active" });
    expect(r.source).toBe("coaching_and_stripe");
    expect(r.duplicateBillingWarning).toBe(true);
  });
  it("paused coaching disables coaching", () => {
    expect(resolveAccess({ ...base, coachingStatus: "paused", stripeStatus: "active" }).coachingEnabled).toBe(false);
  });
  it("ended coaching with Stripe keeps regular access", () => {
    const r = resolveAccess({ ...base, coachingStatus: "ended", stripeStatus: "active" });
    expect(r.source).toBe("stripe");
    expect(r.coachingEnabled).toBe(false);
  });
  it("ended coaching without Stripe hits the paywall", () => {
    expect(resolveAccess({ ...base, coachingStatus: "ended" }).hasAccess).toBe(false);
  });
  it("past_due Stripe does not grant access", () => {
    expect(resolveAccess({ ...base, stripeStatus: "past_due" }).hasAccess).toBe(false);
  });
  it("coach/admin always has access", () => {
    expect(resolveAccess({ ...base, isCoachOrAdmin: true }).source).toBe("coach_admin");
  });
});
