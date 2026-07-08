// M2F OS · The Phase Engine (v2 — dual-labeled).
// Every phase speaks four languages at once: days out, pregnancy weeks,
// what she's going through, and what he must do about it.

export interface Phase {
  id: number;
  slug: string;
  name: string;              // internal/brand name
  window: string;            // days-out window
  pregWindow: string;        // pregnancy-week window (40-week clock)
  focus: string;             // short focus
  herState: string;          // what she's experiencing
  hisJob: string;            // the concrete this-phase directive
  briefing: string;          // combined card copy
  trainingGuidance: string;
  priorityCategories: number[];
}

export const PHASES: Phase[] = [
  {
    id: 1,
    slug: "foundation",
    name: "FOUNDATION",
    window: "180+ days out",
    pregWindow: "Weeks 4–14",
    focus: "Build the base",
    herState: "First trimester — exhausted, nauseous, and processing it all. She may not look pregnant; she feels it constantly.",
    hisJob: "Train hard, fix your sleep, learn the money, and carry more of the load at home without being asked.",
    briefing:
      "Maximum runway. The habits you build now are the ones that survive the newborn phase. She's in the roughest-feeling stretch while showing the least — don't mistake 'not showing' for 'not struggling.'",
    trainingGuidance: "Push hard — this is your highest-intensity window.",
    priorityCategories: [1, 7, 6],
  },
  {
    id: 2,
    slug: "framing",
    name: "FRAMING",
    window: "120–180 days out",
    pregWindow: "Weeks 14–23",
    focus: "Start the preparation",
    herState: "Second trimester — energy is back, the bump is real, and she's nesting. She notices whether you're planning with her or watching her plan.",
    hisJob: "Nursery started, budget built, registry handled together. Training adds carries and grip — dad strength.",
    briefing:
      "The structure goes up. This is the easiest stretch of the whole pregnancy — use it. Everything you finish now is chaos you delete from the third trimester.",
    trainingGuidance: "Keep intensity high; start adding carries and grip work.",
    priorityCategories: [4, 6, 1],
  },
  {
    id: 3,
    slug: "durability",
    name: "DURABILITY",
    window: "60–120 days out",
    pregWindow: "Weeks 23–31",
    focus: "Get durable, get educated",
    herState: "Late second into third trimester — back pain starts, sleep gets harder, and the reality of delivery is on her mind.",
    hisJob: "CPR done, pediatrician picked, car seat researched, birth plan discussed. You become the calmest person in every room.",
    briefing:
      "Shift from chasing numbers to building a body and mind that hold up. The knowledge work peaks here — by the end of this phase you should be able to brief the delivery like an op order.",
    trainingGuidance: "Durability over PRs — core, carries, conditioning, less fatigue.",
    priorityCategories: [3, 5, 1],
  },
  {
    id: 4,
    slug: "staging",
    name: "STAGING",
    window: "30–60 days out",
    pregWindow: "Weeks 32–36",
    focus: "Reduce the chaos",
    herState: "She's uncomfortable, swollen, and tired. Sleeping is a project. Small tasks feel enormous to her right now.",
    hisJob: "Bag packed, seat installed, freezer stocked, nursery done, visitors policy locked. Stop chasing PRs.",
    briefing:
      "Everything gets intentional. Your job this phase: delete every source of day-of chaos while she still has the energy to weigh in on decisions.",
    trainingGuidance: "Maintenance mode — shorter sessions, more mobility, stay fresh.",
    priorityCategories: [4, 5, 7],
  },
  {
    id: 5,
    slug: "mission-mode",
    name: "MISSION MODE",
    window: "Final 30 days",
    pregWindow: "Weeks 36–40+",
    focus: "Stay ready, stay available",
    herState: "Full term is any day now. She's done being pregnant. Every twinge could be the start. She needs steady, not hyped.",
    hisJob: "Phone charged, truck gassed, plans cancelable. Stay healthy, stay recovered, stay reachable. Support her, no scorekeeping.",
    briefing:
      "No PRs. Your only jobs: arrive at Day One fresh, calm, and impossible to catch off guard. This is what the last five months of building were for.",
    trainingGuidance: "Short and easy — the goal is arriving at Day One fresh.",
    priorityCategories: [5, 2, 7],
  },
];

export const FATHER_MODE: Phase = {
  id: 6,
  slug: "father-mode",
  name: "FATHER MODE",
  window: "She's here",
  pregWindow: "Day One+",
  focus: "Day One and every day after",
  herState: "She's recovering from the hardest physical event of her life while feeding a newborn around the clock. Her body and hormones are in full rebuild.",
  hisJob: "Walk, eat protein, hydrate, sleep when you can, hold your daughter, run the house, guard her recovery from visitors.",
  briefing:
    "The build phase is over. No streak guilt, no missed-workout shame. Your training is a tool for staying sane — the mission is them.",
  trainingGuidance: "Recovery workouts and walks — train when life allows, no guilt.",
  priorityCategories: [5, 7, 1],
};

export function getPhase(daysRemaining: number | null, arrived = false): Phase | null {
  if (arrived) return FATHER_MODE;
  if (daysRemaining == null) return null;
  if (daysRemaining > 180) return PHASES[0];
  if (daysRemaining > 120) return PHASES[1];
  if (daysRemaining > 60) return PHASES[2];
  if (daysRemaining > 30) return PHASES[3];
  return PHASES[4];
}

export function daysRemaining(dueDate: string | Date | null | undefined): number | null {
  if (!dueDate) return null;
  const due = typeof dueDate === "string" ? new Date(dueDate + "T00:00:00") : dueDate;
  return Math.max(0, Math.ceil((due.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
}

/** Pregnancy week on the 40-week clock, clamped 4–42. */
export function pregnancyWeek(daysLeft: number | null): number | null {
  if (daysLeft == null) return null;
  return Math.min(42, Math.max(4, 40 - Math.floor(daysLeft / 7)));
}

/** The one-sentence phase brief for Home. e.g. "T-minus 73 days · Week 30 — CPR done, pediatrician picked…" */
export function phaseBrief(phase: Phase, daysLeft: number | null): string {
  const week = pregnancyWeek(daysLeft);
  const head = daysLeft != null && phase.id <= 5 ? `T-minus ${daysLeft} days · Week ${week}` : phase.window;
  return `${head} — ${phase.hisJob}`;
}
