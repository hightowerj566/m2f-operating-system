// M2F OS · The Phase Engine.
// Weeks remaining → phase. The phase is a LENS, not a content unlock:
// same tracks, same missions system — but emphasis, copy, and training
// guidance shift automatically as she gets closer.

export interface Phase {
  id: number;
  slug: string;
  name: string;
  window: string;            // human-readable range
  focus: string;             // one-line focus for the Home header chip
  briefing: string;          // the "why" — shown on Home / Build List
  trainingGuidance: string;  // subtitle for the Training card
  priorityCategories: number[]; // category ids this phase leans on (future mission weighting)
}

export const PHASES: Phase[] = [
  {
    id: 1,
    slug: "foundation",
    name: "PHASE 1 · FOUNDATION",
    window: "180+ days out",
    focus: "Build the base",
    briefing:
      "Maximum runway. Train hard, build muscle, fix sleep, learn the money. The habits you set now are the ones that survive the newborn phase.",
    trainingGuidance: "Push hard — this is your highest-intensity window.",
    priorityCategories: [1, 7, 6], // physical, habits, finances
  },
  {
    id: 2,
    slug: "framing",
    name: "PHASE 2 · FRAMING",
    window: "120–180 days out",
    focus: "Start the preparation",
    briefing:
      "The structure goes up. Nursery planning starts, the budget gets real, and training adds carrying strength and work capacity — the dad-strength stuff.",
    trainingGuidance: "Keep intensity high; start adding carries and grip work.",
    priorityCategories: [4, 6, 1], // home, finances, physical
  },
  {
    id: 3,
    slug: "durability",
    name: "PHASE 3 · DURABILITY",
    window: "60–120 days out",
    focus: "Get durable, get educated",
    briefing:
      "Shift from chasing numbers to building a body and mind that hold up. CPR, pediatrician, car seat, birth plan — the knowledge work peaks here.",
    trainingGuidance: "Durability over PRs — core, carries, conditioning, less fatigue.",
    priorityCategories: [3, 5, 1], // knowledge, relationship, physical
  },
  {
    id: 4,
    slug: "staging",
    name: "PHASE 4 · STAGING",
    window: "30–60 days out",
    focus: "Reduce the chaos",
    briefing:
      "Everything gets intentional. Bag packed, seat installed, freezer stocked, house ready. Training drops to maintenance — shorter sessions, more recovery.",
    trainingGuidance: "Maintenance mode — shorter sessions, more mobility, stay fresh.",
    priorityCategories: [4, 5, 7], // home, relationship, habits
  },
  {
    id: 5,
    slug: "mission-mode",
    name: "PHASE 5 · MISSION MODE",
    window: "Final 30 days",
    focus: "Stay ready, stay available",
    briefing:
      "No PRs. Your only jobs: stay healthy, stay recovered, stay reachable, support her. The phone stays charged and the truck stays gassed.",
    trainingGuidance: "Short and easy — the goal is arriving at Day One fresh.",
    priorityCategories: [5, 2, 7], // relationship, mindset, habits
  },
];

export const FATHER_MODE: Phase = {
  id: 6,
  slug: "father-mode",
  name: "FATHER MODE",
  window: "She's here",
  focus: "Day One and every day after",
  briefing:
    "The build phase is over. No streak guilt, no missed-workout shame. Walk, eat protein, hydrate, sleep when you can, hold your daughter, support your wife.",
  trainingGuidance: "Recovery workouts and walks — train when life allows, no guilt.",
  priorityCategories: [5, 7, 1],
};

/**
 * Resolve the current phase from days remaining.
 * arrived=true always wins (Father Mode). Null days (no due date) → null.
 */
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
