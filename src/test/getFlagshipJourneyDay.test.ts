import { describe, it, expect } from "vitest";
import { addDays, format } from "date-fns";
import { getFlagshipJourneyDay } from "@/lib/training/getFlagshipJourneyDay";

const NOW = new Date("2026-07-16T12:00:00Z");
const dueIn = (n: number) => format(addDays(NOW, n), "yyyy-MM-dd");
const birthAgo = (n: number) => format(addDays(NOW, -n), "yyyy-MM-dd");

describe("getFlagshipJourneyDay", () => {
  it("252 days until due → program day 1", () => {
    const r = getFlagshipJourneyDay({ dueDate: dueIn(252), now: NOW });
    expect(r.status).toBe("active");
    if (r.status === "active") expect(r.programDay).toBe(1);
  });

  it("251 days → day 2", () => {
    const r = getFlagshipJourneyDay({ dueDate: dueIn(251), now: NOW });
    if (r.status === "active") expect(r.programDay).toBe(2);
    else throw new Error("expected active");
  });

  it("200 days → day 53", () => {
    const r = getFlagshipJourneyDay({ dueDate: dueIn(200), now: NOW });
    if (r.status === "active") expect(r.programDay).toBe(53);
    else throw new Error("expected active");
  });

  it("100 days → day 153", () => {
    const r = getFlagshipJourneyDay({ dueDate: dueIn(100), now: NOW });
    if (r.status === "active") expect(r.programDay).toBe(153);
    else throw new Error("expected active");
  });

  it("30 days → day 223", () => {
    const r = getFlagshipJourneyDay({ dueDate: dueIn(30), now: NOW });
    if (r.status === "active") expect(r.programDay).toBe(223);
    else throw new Error("expected active");
  });

  it("7 days → day 246", () => {
    const r = getFlagshipJourneyDay({ dueDate: dueIn(7), now: NOW });
    if (r.status === "active") expect(r.programDay).toBe(246);
    else throw new Error("expected active");
  });

  it("0 days → day 252 (final mission-mode)", () => {
    const r = getFlagshipJourneyDay({ dueDate: dueIn(0), now: NOW });
    if (r.status === "active") expect(r.programDay).toBe(252);
    else throw new Error("expected active");
  });

  it("253 days → pre-program onboarding", () => {
    const r = getFlagshipJourneyDay({ dueDate: dueIn(253), now: NOW });
    expect(r.status).toBe("pre-program");
    if (r.status === "pre-program") expect(r.daysUntilProgramStart).toBe(1);
  });

  it("past due date without birth → birth-window", () => {
    const r = getFlagshipJourneyDay({ dueDate: dueIn(-3), now: NOW });
    expect(r.status).toBe("post-due-date");
  });

  it("birth confirmed today → post-birth day 1 (survival)", () => {
    const r = getFlagshipJourneyDay({ babyArrivedAt: birthAgo(0), now: NOW });
    if (r.status === "post-birth") {
      expect(r.postpartumDay).toBe(1);
      expect(r.stageId).toBe("new-dad-survival");
    } else throw new Error("expected post-birth");
  });

  it("birth 35 days ago → still survival (day 36 begins foundation)", () => {
    const r = getFlagshipJourneyDay({ babyArrivedAt: birthAgo(34), now: NOW });
    if (r.status === "post-birth") {
      expect(r.postpartumDay).toBe(35);
      expect(r.stageId).toBe("new-dad-survival");
    } else throw new Error("expected post-birth");
  });

  it("birth 36 days ago → new-dad-foundation", () => {
    const r = getFlagshipJourneyDay({ babyArrivedAt: birthAgo(35), now: NOW });
    if (r.status === "post-birth") {
      expect(r.postpartumDay).toBe(36);
      expect(r.stageId).toBe("new-dad-foundation");
    } else throw new Error("expected post-birth");
  });

  it("birth 85 days ago → father-athlete", () => {
    const r = getFlagshipJourneyDay({ babyArrivedAt: birthAgo(84), now: NOW });
    if (r.status === "post-birth") {
      expect(r.postpartumDay).toBe(85);
      expect(r.stageId).toBe("father-athlete");
    } else throw new Error("expected post-birth");
  });

  it("coach assignment active → coach-override with flagship preserved", () => {
    const r = getFlagshipJourneyDay({
      dueDate: dueIn(100),
      coachAssignment: {
        programId: "x",
        programName: "Coach Prog",
        currentDay: 5,
        totalDays: 84,
      },
      now: NOW,
    });
    if (r.status === "coach-override") {
      expect(r.coachProgramDay).toBe(5);
      expect(r.flagshipProgramDay).toBe(153);
    } else throw new Error("expected coach-override");
  });

  it("coach ends → returns to correct current flagship day", () => {
    const r = getFlagshipJourneyDay({ dueDate: dueIn(100), coachAssignment: null, now: NOW });
    if (r.status === "active") expect(r.programDay).toBe(153);
    else throw new Error("expected active");
  });

  it("no due date and no birth → needs-due-date", () => {
    const r = getFlagshipJourneyDay({ now: NOW });
    expect(r.status).toBe("needs-due-date");
  });
});
