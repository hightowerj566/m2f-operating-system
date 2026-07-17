// M2F OS · The single guided journey.
// One row per stage — pregnancy → post-birth → father athlete — with the
// programmatic slug that ties into pre/postBirthTraining.ts and the
// user-facing metadata the Programs UI renders. Ordering here IS the
// timeline order on-screen.

export type StageStatus = "completed" | "current" | "upcoming" | "locked";

export interface JourneyStage {
  slug: string;
  name: string;              // Display name
  era: "pregnancy" | "post-birth";
  window: string;            // e.g. "Weeks 4–14" or "Birth – 6 weeks"
  purpose: string;
  frequency: string;         // "5 days" etc.
  split: string;             // Weekly split summary
  nutrition: string;
  recovery: string;
  outcome: string;
  duration: string;          // "10 weeks"
  progressionRule: string;   // "Double progression" etc.
  /** Program slug in preBirthTraining.ts or postBirthTraining.ts */
  programSlug: string;
  /** Which era-native program registry this stage belongs to. */
  programSource: "pre-birth" | "post-birth";
}

export const JOURNEY_STAGES: JourneyStage[] = [
  {
    slug: "foundation",
    name: "Foundation",
    era: "pregnancy",
    window: "Weeks 4–14",
    purpose: "Build muscle while you still have predictable recovery.",
    frequency: "5 days",
    split: "Upper A · Lower A · Upper B · Lower B · Pump + Conditioning",
    nutrition: "Slight surplus or recomp",
    recovery: "8 hours of sleep is the actual program",
    outcome: "Highest hypertrophy runway of the whole pregnancy",
    duration: "10 weeks",
    progressionRule: "Double progression — add a rep before adding load",
    programSlug: "prebirth-foundation",
    programSource: "pre-birth",
  },
  {
    slug: "framing",
    name: "Framing",
    era: "pregnancy",
    window: "Weeks 15–23",
    purpose: "Get stronger. Add loaded carries and grip — dad strength.",
    frequency: "5 days",
    split: "Upper A · Lower A · Upper B · Lower B + Carries · Pump",
    nutrition: "Hold bodyweight or slow recomp",
    recovery: "Manage joint stress; earn every intensity peak",
    outcome: "Strength you can carry a car seat with",
    duration: "9 weeks",
    progressionRule: "Linear intensity — 4–6 rep strength blocks",
    programSlug: "prebirth-framing",
    programSource: "pre-birth",
  },
  {
    slug: "durability",
    name: "Durability",
    era: "pregnancy",
    window: "Weeks 24–31",
    purpose: "Trade PRs for durability. Build a body that shows up daily.",
    frequency: "4 days",
    split: "Full Body A · B · C · D — single-leg, carries, conditioning",
    nutrition: "Maintenance",
    recovery: "Two conditioning blocks weekly, walking on off days",
    outcome: "Repeatable strength you don't have to psych up for",
    duration: "8 weeks",
    progressionRule: "5×5 maintenance at RPE 7 — never grinding",
    programSlug: "prebirth-durability",
    programSource: "pre-birth",
  },
  {
    slug: "staging-mission-mode",
    name: "Mission Mode",
    era: "pregnancy",
    window: "Weeks 32–40",
    purpose: "Arrive at Day One fresh, calm, and impossible to catch off guard.",
    frequency: "4 → 3 days",
    split: "Full Body A · B · C (D optional) — every session cancelable",
    nutrition: "Maintenance — never an aggressive cut",
    recovery: "Sessions ≤35 min. Walk, mobility, sleep.",
    outcome: "Delivery-ready. No PRs, no soreness contests.",
    duration: "9 weeks",
    progressionRule: "Hold load. RPE ≤7. Preparedness outranks fatigue.",
    programSlug: "prebirth-staging-mission-mode",
    programSource: "pre-birth",
  },
  {
    slug: "survival",
    name: "New Dad Survival",
    era: "post-birth",
    window: "Birth – 6 weeks",
    purpose: "Maintain the pattern without creating recovery debt.",
    frequency: "2 days + optional walk",
    split: "Survival A · Survival B · Optional walk + mobility",
    nutrition: "Protein floor, hydration, whatever gets eaten counts",
    recovery: "Sleep is the training variable. Under 5 hours → Minimum.",
    outcome: "You held the base while the world shifted underfoot.",
    duration: "6 weeks",
    progressionRule: "No progression. Two clean reps in reserve, always.",
    programSlug: "new-dad-survival",
    programSource: "post-birth",
  },
  {
    slug: "foundation-postbirth",
    name: "New Dad Foundation",
    era: "post-birth",
    window: "6 – 12 weeks",
    purpose: "Rebuild structured training. Consistency over intensity.",
    frequency: "3 days (+ optional Day D)",
    split: "Full-body A · B · C · optional pump / carry Day D",
    nutrition: "Return to protein target and structured meals",
    recovery: "Add load only when all sets finish with 2 reps in reserve",
    outcome: "Structured programming is back — with a newborn in the room.",
    duration: "6 weeks",
    progressionRule: "Slow double progression — earn every rep",
    programSlug: "new-dad-foundation",
    programSource: "post-birth",
  },
  {
    slug: "father-athlete",
    name: "Father Athlete",
    era: "post-birth",
    window: "3 months onward",
    purpose: "Train as a long-term pillar. Strength, hypertrophy, work capacity.",
    frequency: "4 days default (5 when sleep is stable)",
    split: "Lower Strength · Upper Strength · Hinge + Back · Upper Hyp (· Pump)",
    nutrition: "Match the goal — surplus, recomp, or slow cut",
    recovery: "3-week accumulation, 1-week deload. Sleep governs attendance.",
    outcome: "The father-athlete standard: strong, durable, present.",
    duration: "Ongoing",
    progressionRule: "3+1 mesocycles. Add reps, then load, then a set.",
    programSlug: "father-athlete",
    programSource: "post-birth",
  },
];

export function stageBySlug(slug: string): JourneyStage | null {
  return JOURNEY_STAGES.find((stage) => stage.slug === slug) ?? null;
}
