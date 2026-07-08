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

describe("missions week math", async () => {
  const { weekStart } = await import("@/hooks/useMissions");
  it("returns a Monday", () => {
    const ws = weekStart(new Date("2026-07-08T12:00:00")); // a Wednesday
    expect(ws).toBe("2026-07-06");
    expect(new Date(ws + "T00:00:00").getDay()).toBe(1);
  });
  it("Sunday maps back to the previous Monday", () => {
    expect(weekStart(new Date("2026-07-12T12:00:00"))).toBe("2026-07-06");
  });
  it("Monday maps to itself", () => {
    expect(weekStart(new Date("2026-07-06T08:00:00"))).toBe("2026-07-06");
  });
});

describe("phase engine", async () => {
  const { getPhase } = await import("@/lib/phases");
  it("maps days remaining to the five phases", () => {
    expect(getPhase(200)?.id).toBe(1);
    expect(getPhase(181)?.id).toBe(1);
    expect(getPhase(180)?.id).toBe(2);
    expect(getPhase(121)?.id).toBe(2);
    expect(getPhase(120)?.id).toBe(3);
    expect(getPhase(61)?.id).toBe(3);
    expect(getPhase(60)?.id).toBe(4);
    expect(getPhase(31)?.id).toBe(4);
    expect(getPhase(30)?.id).toBe(5);
    expect(getPhase(0)?.id).toBe(5);
  });
  it("Father Mode wins regardless of days", () => {
    expect(getPhase(90, true)?.id).toBe(6);
    expect(getPhase(null, true)?.id).toBe(6);
  });
  it("no due date and not arrived → null", () => {
    expect(getPhase(null)).toBeNull();
  });
});

describe("build list score math", async () => {
  const { applyMilestoneBoost, surfaceMilestones } = await import("@/hooks/useBuildList");
  const base = { physical: 8, mindset: 5, knowledge: 3, home: 2, relationship: 6, finances: 1, habits: 4 } as const;

  it("adds completed points to the right categories", () => {
    const r = applyMilestoneBoost({ ...base }, [
      { category_id: 6, points: 2, completed: true },
      { category_id: 4, points: 1, completed: true },
      { category_id: 3, points: 2, completed: false }, // incomplete: ignored
    ]);
    expect(r.byCategory.finances).toBe(3);
    expect(r.byCategory.home).toBe(3);
    expect(r.byCategory.knowledge).toBe(3);
    expect(r.boost).toBe(3);
  });

  it("caps every category at 10", () => {
    const r = applyMilestoneBoost({ ...base }, [
      { category_id: 1, points: 3, completed: true },
      { category_id: 1, points: 3, completed: true },
    ]);
    expect(r.byCategory.physical).toBe(10); // 8 + 6 capped
    expect(r.boost).toBe(2); // only the capped gain counts
  });

  it("surfaces overdue, then current phase, then pulls the next phase forward", () => {
    const ms = [
      { id: "a", category_id: 1, phase: 1, title: "", detail: null, points: 1, sort_order: 1, completed: false },
      { id: "b", category_id: 1, phase: 3, title: "", detail: null, points: 1, sort_order: 1, completed: false },
      { id: "c", category_id: 1, phase: 4, title: "", detail: null, points: 1, sort_order: 1, completed: false },
      { id: "d", category_id: 1, phase: 3, title: "", detail: null, points: 1, sort_order: 2, completed: true },
    ];
    const top = surfaceMilestones(ms as never, 3, 3);
    expect(top.map((m) => m.id)).toEqual(["a", "b", "c"]); // overdue P1 first, current P3, then P4 pulled forward
  });

  it("pulls future phases forward when current phase is fully built", () => {
    const ms = [
      { id: "p3", category_id: 1, phase: 3, title: "", detail: null, points: 1, sort_order: 1, completed: true },
      { id: "p4", category_id: 1, phase: 4, title: "", detail: null, points: 1, sort_order: 1, completed: false },
      { id: "p5", category_id: 1, phase: 5, title: "", detail: null, points: 1, sort_order: 1, completed: false },
    ];
    const top = surfaceMilestones(ms as never, 3, 2);
    expect(top.map((m) => m.id)).toEqual(["p4", "p5"]);
  });
});
