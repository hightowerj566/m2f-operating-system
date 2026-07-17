import { describe, it, expect } from "vitest";
import { recommendVersion } from "@/lib/smartRecommendation";

describe("recommendVersion", () => {
  it("recommends minimum for a brand-new baby", () => {
    expect(recommendVersion({ babyAgeDays: 5 }).version).toBe("minimum");
  });
  it("recommends minimum under 5 hours of sleep", () => {
    expect(recommendVersion({ sleepHours: 4 }).version).toBe("minimum");
  });
  it("recommends express for a rough night", () => {
    expect(recommendVersion({ sleepHours: 6 }).version).toBe("express");
  });
  it("recommends express after 3 hard sessions", () => {
    expect(recommendVersion({ hardSessions7d: 3 }).version).toBe("express");
  });
  it("recommends full and stays invisible on a green day", () => {
    const r = recommendVersion({ sleepHours: 8, hardSessions7d: 1 });
    expect(r.version).toBe("full");
    expect(r.visible).toBe(false);
  });
  it("nudges to full when yesterday was missed", () => {
    const r = recommendVersion({ sleepHours: 8, missedYesterday: true });
    expect(r.version).toBe("full");
    expect(r.visible).toBe(true);
  });
});
