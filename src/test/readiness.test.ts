import { describe, it, expect } from "vitest";
import {
  APPENDIX_A,
  scoreAssessment,
  getBand,
  routeTrack,
  weeksRemaining,
  CATEGORIES,
} from "@/lib/readiness";

describe("Readiness assessment content", () => {
  it("has 14 scored + 3 routing questions", () => {
    expect(APPENDIX_A.filter((q) => q.kind === "scored")).toHaveLength(14);
    expect(APPENDIX_A.filter((q) => q.kind === "routing")).toHaveLength(3);
  });

  it("every category has exactly 2 scored questions with 0/1/3/5 options", () => {
    for (const cat of CATEGORIES) {
      const qs = APPENDIX_A.filter((q) => q.kind === "scored" && q.category_id === cat.id);
      expect(qs).toHaveLength(2);
      for (const q of qs) {
        expect(q.options.map((o) => o.points)).toEqual([0, 1, 3, 5]);
      }
    }
  });
});

describe("scoreAssessment", () => {
  it("scores a perfect run as 70 with every category at 10", () => {
    const answers = Object.fromEntries(
      APPENDIX_A.filter((q) => q.kind === "scored").map((q) => [q.code, 5]),
    );
    const r = scoreAssessment(answers, APPENDIX_A);
    expect(r.total).toBe(70);
    for (const cat of CATEGORIES) expect(r.byCategory[cat.slug]).toBe(10);
  });

  it("finds the weakest category", () => {
    const answers = Object.fromEntries(
      APPENDIX_A.filter((q) => q.kind === "scored").map((q) => [q.code, 5]),
    );
    answers["F1"] = 0;
    answers["F2"] = 0;
    const r = scoreAssessment(answers, APPENDIX_A);
    expect(r.weakest.slug).toBe("finances");
    expect(r.byCategory.finances).toBe(0);
    expect(r.total).toBe(60);
  });
});

describe("score bands", () => {
  it("maps totals to the four Appendix A bands", () => {
    expect(getBand(0).name).toContain("FOUNDATION");
    expect(getBand(24).name).toContain("FOUNDATION");
    expect(getBand(25).name).toContain("FRAMING");
    expect(getBand(44).name).toContain("FRAMING");
    expect(getBand(45).name).toContain("FINISHING");
    expect(getBand(59).name).toContain("FINISHING");
    expect(getBand(60).name).toContain("READY");
    expect(getBand(70).name).toContain("READY");
  });

  it("FRAMING copy interpolates weeks remaining", () => {
    expect(getBand(30).copy(15)).toContain("15 weeks");
  });
});

describe("routeTrack (D1: Rebuild/Perform)", () => {
  it("routes experienced + equipped + 4+ days to Perform", () => {
    expect(routeTrack({ R1: "3plus", R2: "full_gym", R3: "4" })).toBe("M2F Perform");
    expect(routeTrack({ R1: "1_3yr", R2: "home_setup", R3: "5plus" })).toBe("M2F Perform");
  });

  it("routes everyone else to Rebuild", () => {
    expect(routeTrack({ R1: "under_1yr", R2: "full_gym", R3: "5plus" })).toBe("M2F Rebuild");
    expect(routeTrack({ R1: "3plus", R2: "bodyweight", R3: "5plus" })).toBe("M2F Rebuild");
    expect(routeTrack({ R1: "3plus", R2: "full_gym", R3: "3" })).toBe("M2F Rebuild");
  });
});

describe("the clock", () => {
  it("computes weeks remaining from a future date", () => {
    const inSeventyDays = new Date(Date.now() + 70 * 24 * 60 * 60 * 1000);
    expect(weeksRemaining(inSeventyDays)).toBe(10);
  });

  it("clamps past dates to zero", () => {
    expect(weeksRemaining(new Date(Date.now() - 7 * 24 * 60 * 60 * 1000))).toBe(0);
  });
});
