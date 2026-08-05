import { describe, it, expect } from "vitest";
import {
  PHASES, FATHER_MODE, isPhaseUnlocked, phaseUnlockLabel, unlockedPhaseIds,
} from "@/lib/phases";

describe("phase unlocking", () => {
  it("unlocks a phase once the client's pregnancy week reaches its startWeek", () => {
    const phase3 = PHASES[2]; // startWeek 23
    expect(isPhaseUnlocked(phase3.id, { currentPregnancyWeek: 22, babyArrived: false, dueDatePassed: false })).toBe(false);
    expect(isPhaseUnlocked(phase3.id, { currentPregnancyWeek: 23, babyArrived: false, dueDatePassed: false })).toBe(true);
    expect(isPhaseUnlocked(phase3.id, { currentPregnancyWeek: 30, babyArrived: false, dueDatePassed: false })).toBe(true);
  });

  it("a client joining midway at week 30 unlocks every phase starting at or before week 30, and only those", () => {
    const ctx = { currentPregnancyWeek: 30, babyArrived: false, dueDatePassed: false };
    const unlocked = unlockedPhaseIds(ctx);
    // Phase starts: 4, 14, 23, 32, 36 → 1,2,3 unlock; 4,5 stay locked.
    expect(unlocked.has(1)).toBe(true);
    expect(unlocked.has(2)).toBe(true);
    expect(unlocked.has(3)).toBe(true);
    expect(unlocked.has(4)).toBe(false);
    expect(unlocked.has(5)).toBe(false);
  });

  it("earlier phases stay accessible even once complete (unlock never regresses)", () => {
    const ctx = { currentPregnancyWeek: 36, babyArrived: false, dueDatePassed: false };
    const unlocked = unlockedPhaseIds(ctx);
    expect(unlocked.has(1)).toBe(true);
    expect(unlocked.has(2)).toBe(true);
    expect(unlocked.has(3)).toBe(true);
    expect(unlocked.has(4)).toBe(true);
    expect(unlocked.has(5)).toBe(true);
  });

  it("pregnancy beyond week 40 (overdue) unlocks every pregnancy phase", () => {
    const ctx = { currentPregnancyWeek: 42, babyArrived: false, dueDatePassed: false };
    for (const p of PHASES) expect(isPhaseUnlocked(p.id, ctx)).toBe(true);
  });

  it("no due date on file yet: only the first phase is available", () => {
    const ctx = { currentPregnancyWeek: null, babyArrived: false, dueDatePassed: false };
    expect(isPhaseUnlocked(PHASES[0].id, ctx)).toBe(true);
    for (const p of PHASES.slice(1)) expect(isPhaseUnlocked(p.id, ctx)).toBe(false);
    expect(isPhaseUnlocked(FATHER_MODE.id, ctx)).toBe(false);
  });

  it("Father Mode locks until arrival or due date passed, independent of pregnancy week", () => {
    const notYet = { currentPregnancyWeek: 40, babyArrived: false, dueDatePassed: false };
    expect(isPhaseUnlocked(FATHER_MODE.id, notYet)).toBe(false);

    const arrivedEarly = { currentPregnancyWeek: 30, babyArrived: true, dueDatePassed: false };
    expect(isPhaseUnlocked(FATHER_MODE.id, arrivedEarly)).toBe(true);

    const duePassed = { currentPregnancyWeek: 42, babyArrived: false, dueDatePassed: true };
    expect(isPhaseUnlocked(FATHER_MODE.id, duePassed)).toBe(true);
  });

  it("baby arrived early: the full pregnancy roadmap stays accessible regardless of week reached", () => {
    const ctx = { currentPregnancyWeek: 20, babyArrived: true, dueDatePassed: false };
    for (const p of PHASES) expect(isPhaseUnlocked(p.id, ctx)).toBe(true);
    expect(isPhaseUnlocked(FATHER_MODE.id, ctx)).toBe(true);
  });

  it("phaseUnlockLabel reports the exact unlock week, and Father Mode as Day One", () => {
    expect(phaseUnlockLabel(PHASES[3].id)).toBe("Unlocks at Week 32");
    expect(phaseUnlockLabel(FATHER_MODE.id)).toBe("Unlocks Day One");
  });
});
