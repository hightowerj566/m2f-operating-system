import { describe, it, expect, vi, afterEach } from "vitest";
import {
  babyAgeDays,
  babyAgeLabel,
  getPostBirthPhase,
  daysRemaining,
  POST_BIRTH_PHASES,
} from "@/lib/phases";
import { missionsForPhase, POST_BIRTH_MISSIONS } from "@/content/postBirthMissions";
import { POST_BIRTH_PROGRAMS, programForSlug } from "@/content/postBirthTraining";

const iso = (d: Date) => d.toISOString().slice(0, 10);
const daysAgo = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return iso(d);
};
const daysAhead = (n: number) => {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return iso(d);
};

afterEach(() => vi.useRealTimers());

describe("countdown safety", () => {
  it("never returns a negative countdown, even past the due date", () => {
    expect(daysRemaining(daysAgo(30))).toBe(0);
    expect(daysRemaining(daysAgo(1))).toBe(0);
  });
  it("returns null with no due date", () => {
    expect(daysRemaining(null)).toBeNull();
  });
});

describe("babyAgeDays / babyAgeLabel", () => {
  it("returns null without a birth date or with an invalid one", () => {
    expect(babyAgeDays(null)).toBeNull();
    expect(babyAgeDays("not-a-date")).toBeNull();
    expect(babyAgeLabel(null)).toBeNull();
  });
  it("clamps a future (mistyped) birth date to 0, never negative", () => {
    expect(babyAgeDays(daysAhead(10))).toBe(0);
  });
  it("formats per spec: days, weeks, months", () => {
    expect(babyAgeLabel(3)).toBe("3 days old");
    expect(babyAgeLabel(1)).toBe("1 day old");
    expect(babyAgeLabel(14)).toBe("2 weeks old");
    expect(babyAgeLabel(49)).toBe("7 weeks old");
    expect(babyAgeLabel(122)).toBe("4 months old");
    expect(babyAgeLabel(370)).toBe("1 year old");
  });
});

describe("getPostBirthPhase", () => {
  it("maps ages to the four phases at the boundaries", () => {
    expect(getPostBirthPhase(0)?.slug).toBe("survival");
    expect(getPostBirthPhase(41)?.slug).toBe("survival");
    expect(getPostBirthPhase(42)?.slug).toBe("foundation");
    expect(getPostBirthPhase(83)?.slug).toBe("foundation");
    expect(getPostBirthPhase(84)?.slug).toBe("rhythm");
    expect(getPostBirthPhase(182)?.slug).toBe("rhythm");
    expect(getPostBirthPhase(183)?.slug).toBe("growth");
    expect(getPostBirthPhase(365)?.slug).toBe("growth");
  });
  it("a user joining after birth lands in the correct phase from age alone", () => {
    // Baby born 100 days ago, user signs up today
    expect(getPostBirthPhase(babyAgeDays(daysAgo(100)))?.slug).toBe("rhythm");
  });
  it("returns null with no birth date", () => {
    expect(getPostBirthPhase(null)).toBeNull();
  });
});

describe("post-birth missions", () => {
  it("every phase has missions and every mission has the required fields", () => {
    for (const phase of POST_BIRTH_PHASES) {
      const list = missionsForPhase(phase.slug);
      expect(list.length).toBeGreaterThan(0);
      for (const m of list) {
        expect(m.title).toBeTruthy();
        expect(m.description).toBeTruthy();
        expect(m.category).toBeTruthy();
        expect(m.estMinutes).toBeGreaterThan(0);
        expect(m.phase).toBe(phase.slug);
      }
    }
  });
  it("mission keys are unique (they drive completion storage)", () => {
    const keys = POST_BIRTH_MISSIONS.map((m) => m.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("post-birth training", () => {
  it("every phase resolves to a real program", () => {
    for (const phase of POST_BIRTH_PHASES) {
      expect(programForSlug(phase.programSlug)).not.toBeNull();
    }
  });
  it("every workout has Full, Express, and Minimum versions with exercises", () => {
    for (const program of POST_BIRTH_PROGRAMS) {
      expect(program.workouts.length).toBeGreaterThan(0);
      for (const w of program.workouts) {
        for (const v of ["full", "express", "minimum"] as const) {
          const spec = w.versions[v];
          expect(spec.minutes).toBeTruthy();
          expect(spec.exercises.length).toBeGreaterThan(0);
        }
        expect(w.objective).toBeTruthy();
        expect(w.coachingNote).toBeTruthy();
        expect(w.equipment).toBeTruthy();
      }
    }
  });
});
