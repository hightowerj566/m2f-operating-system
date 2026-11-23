import { describe, it, expect } from "vitest";
import { normalizeReferralCode, summarizeMonth, monthKey } from "@/lib/referrals";

describe("referrals", () => {
  it("normalizes codes to uppercase without spaces", () => {
    expect(normalizeReferralCode(" john 25! ")).toBe("JOHN25");
  });
  it("a free-trial signup is tracked but not owed", () => {
    const s = summarizeMonth([{ code_id: "a", signed_up_at: "2026-11-03T10:00:00Z", first_paid_at: null, payout_cents: null }], "2026-11-01");
    expect(s.get("a")).toEqual({ signups: 1, paying: 0, owedCents: 0 });
  });
  it("payout is owed in the month of the first payment", () => {
    const rows = [{ code_id: "a", signed_up_at: "2026-11-28T10:00:00Z", first_paid_at: "2026-12-05T10:00:00Z", payout_cents: 1000 }];
    expect(summarizeMonth(rows, "2026-11-01").get("a")?.owedCents).toBe(0);
    expect(summarizeMonth(rows, "2026-12-01").get("a")).toEqual({ signups: 0, paying: 1, owedCents: 1000 });
  });
  it("monthKey uses the first of the month", () => {
    expect(monthKey("2026-02-14T00:00:00Z")).toBe("2026-02-01");
  });
});
