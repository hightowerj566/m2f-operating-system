import { describe, it, expect } from "vitest";
import { resolveJourney } from "@/lib/programJourney";

const todayISO = (offsetDays: number) => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().slice(0, 10);
};

describe("resolveJourney", () => {
  it("returns empty-state when nothing is set", () => {
    const r = resolveJourney({ dueDate: null, babyArrivedAt: null, coachAssignment: null });
    expect(r.track).toBe("guided");
    expect(r.stage).toBeNull();
  });

  it("routes an early pregnancy to Foundation", () => {
    // ~35 weeks out → pregnancy week ~5
    const r = resolveJourney({ dueDate: todayISO(35 * 7), babyArrivedAt: null, coachAssignment: null });
    expect(r.track).toBe("guided");
    expect(r.stage?.slug).toBe("foundation");
    expect(r.eraLabel).toBe("Pregnancy");
  });

  it("routes a 30-week pregnancy to Durability", () => {
    // 10 weeks out → pregnancy week 30
    const r = resolveJourney({ dueDate: todayISO(10 * 7), babyArrivedAt: null, coachAssignment: null });
    expect(r.stage?.slug).toBe("durability");
  });

  it("routes a newborn (3 days old) to Survival", () => {
    const r = resolveJourney({ dueDate: null, babyArrivedAt: todayISO(-3), coachAssignment: null });
    expect(r.stage?.slug).toBe("survival");
    expect(r.eraLabel).not.toBe("Pregnancy");
  });

  it("routes an 8-week-old to New Dad Foundation", () => {
    const r = resolveJourney({ dueDate: null, babyArrivedAt: todayISO(-56), coachAssignment: null });
    expect(r.stage?.slug).toBe("foundation-postbirth");
  });

  it("routes a 6-month-old to Father Athlete", () => {
    const r = resolveJourney({ dueDate: null, babyArrivedAt: todayISO(-183), coachAssignment: null });
    expect(r.stage?.slug).toBe("father-athlete");
  });

  it("shows coach program as active while keeping guided stage as context", () => {
    const r = resolveJourney({
      dueDate: todayISO(60),
      babyArrivedAt: null,
      coachAssignment: {
        programId: "x", programName: "Coach Prog", currentDay: 5, totalDays: 84,
        assignedAt: new Date().toISOString(), assignedByCoachName: null,
      },
    });
    expect(r.track).toBe("coach");
    expect(r.coach?.programName).toBe("Coach Prog");
    // Guided stage still resolved for timeline context
    expect(r.stage).not.toBeNull();
  });


  it("falls back to coach lane when neither due nor baby is set", () => {
    const r = resolveJourney({
      dueDate: null,
      babyArrivedAt: null,
      coachAssignment: {
        programId: "x", programName: "Coach Prog", currentDay: 21, totalDays: 84,
        assignedAt: new Date().toISOString(), assignedByCoachName: null,
      },
    });
    expect(r.track).toBe("coach");
    expect(r.coach?.programName).toBe("Coach Prog");
  });

  it("returns 7 schedule cells", () => {
    const r = resolveJourney({ dueDate: todayISO(60), babyArrivedAt: null, coachAssignment: null });
    expect(r.weekSchedule.length).toBe(7);
    expect(r.weekSchedule.filter((c) => c.isToday).length).toBe(1);
  });

  it("annotates the timeline with exactly one current stage", () => {
    const r = resolveJourney({ dueDate: todayISO(60), babyArrivedAt: null, coachAssignment: null });
    const currents = r.timeline.filter((t) => t.status === "current");
    expect(currents.length).toBe(1);
  });
});
