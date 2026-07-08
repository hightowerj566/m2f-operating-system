// M2F OS · Readiness core: categories, scoring, bands, routing, clock.
// Question content is served from Supabase (assessment_questions/options);
// APPENDIX_A below is the bundled fallback so the public /readiness funnel
// never white-screens if the fetch fails.

export const CATEGORIES = [
  { id: 1, slug: "physical", name: "PHYSICAL" },
  { id: 2, slug: "mindset", name: "MINDSET" },
  { id: 3, slug: "knowledge", name: "KNOWLEDGE" },
  { id: 4, slug: "home", name: "HOME" },
  { id: 5, slug: "relationship", name: "RELATIONSHIP" },
  { id: 6, slug: "finances", name: "FINANCES" },
  { id: 7, slug: "habits", name: "HABITS" },
] as const;

export type Category = (typeof CATEGORIES)[number];
export type CategorySlug = Category["slug"];

export interface AssessmentOption {
  id?: string;
  label: string;
  points: number | null;      // 0|1|3|5 for scored, null for routing
  routing_value?: string | null;
}

export interface AssessmentQuestion {
  id?: string;
  code: string;               // 'P1'..'HB2', 'R1'..'R3'
  category_id: number | null; // null for routing
  prompt: string;
  kind: "scored" | "routing";
  options: AssessmentOption[];
}

const q = (
  code: string,
  category_id: number | null,
  kind: "scored" | "routing",
  prompt: string,
  options: [string, number | null, string?][],
): AssessmentQuestion => ({
  code,
  category_id,
  kind,
  prompt,
  options: options.map(([label, points, routing_value]) => ({ label, points, routing_value })),
});

/** Bundled copy of the seeded Appendix A content (fallback only). */
export const APPENDIX_A: AssessmentQuestion[] = [
  q("P1", 1, "scored", "Last 30 days, how many weeks did you train at least 3 times?", [
    ["None", 0], ["One or two", 1], ["Most weeks", 3], ["Every week", 5],
  ]),
  q("P2", 1, "scored", "Could you carry a car seat, a stroller, and four grocery bags up a flight of stairs — today, without a warmup?", [
    ["That's a workout program, not a question", 0], ["I'd make it, barely", 1], ["Yes, uncomfortably", 3], ["Easily. That's Tuesday", 5],
  ]),
  q("M1", 2, "scored", "When you think about the day she arrives, the honest first feeling is:", [
    ["Quiet panic", 0], ["Mostly fear, some excitement", 1], ["Excited but unprepared", 3], ["Ready. Nervous, but ready", 5],
  ]),
  q("M2", 2, "scored", "Have you said any of your fears about becoming a dad out loud — to anyone?", [
    ["I don't talk about that", 0], ["Only to myself in the truck", 1], ["Once or twice to my wife or a friend", 3], ["Yes, openly", 5],
  ]),
  q("K1", 3, "scored", "Do you know what actually happens at the hospital — stages of labor, when to go, what your job is in the room?", [
    ["My job is to not pass out", 0], ["I've seen movies", 1], ["I've read some things", 3], ["I could brief someone else on it", 5],
  ]),
  q("K2", 3, "scored", "Could you, right now, do all three: change a diaper, swaddle, and safely put a newborn down to sleep?", [
    ["Zero of three", 0], ["One of three", 1], ["Two of three", 3], ["All three", 5],
  ]),
  q("H1", 4, "scored", "Where does the nursery/baby-space stand?", [
    ["It's still the room we don't talk about", 0], ["Started, stalled", 1], ["Mostly done", 3], ["Done — crib built, car seat installed", 5],
  ]),
  q("H2", 4, "scored", "Do you have a hospital-day plan — bag packed, route known, who's watching the dogs?", [
    ["No plan", 0], ["A plan in my head", 1], ["Half-executed", 3], ["Bag's by the door", 5],
  ]),
  q("REL1", 5, "scored", "In the last two weeks, how many real conversations have you had with your wife about how you two will handle the newborn phase — nights, visitors, division of labor?", [
    ["Zero", 0], ["It came up once, briefly", 1], ["One real conversation", 3], ["It's an ongoing conversation", 5],
  ]),
  q("REL2", 5, "scored", "Does she feel like you're preparing WITH her, or watching her prepare?", [
    ["She'd say watching", 0], ["Honestly, mostly watching", 1], ["Mixed", 3], ["With her — she'd say it too", 5],
  ]),
  q("F1", 6, "scored", "Do you know the real number — what delivery, insurance, and the first year will roughly cost you?", [
    ["No idea and I'd rather not know", 0], ["A guess", 1], ["A researched estimate", 3], ["Yes, and it's budgeted", 5],
  ]),
  q("F2", 6, "scored", "If you couldn't work for 8 weeks starting today, your family would be:", [
    ["In trouble fast", 0], ["OK for a couple weeks", 1], ["Tight but fine", 3], ["Covered — emergency fund + leave sorted", 5],
  ]),
  q("HB1", 7, "scored", "Pick the statement closest to your evenings:", [
    ["Screens until I fall asleep", 0], ["Mostly screens, some intention", 1], ["A loose routine", 3], ["A locked routine — I run my evenings, they don't run me", 5],
  ]),
  q("HB2", 7, "scored", "Sleep, most nights:", [
    ["Under 6 hours, chaotic", 0], ["Under 6, consistent-ish", 1], ["6–7, decent", 3], ["7+, protected", 5],
  ]),
  q("R1", null, "routing", "Training experience:", [
    ["Under a year", null, "under_1yr"], ["1–3 years", null, "1_3yr"], ["3+ years consistent", null, "3plus"],
  ]),
  q("R2", null, "routing", "Equipment access:", [
    ["Full gym", null, "full_gym"], ["Home setup (some equipment)", null, "home_setup"], ["Bodyweight only", null, "bodyweight"],
  ]),
  q("R3", null, "routing", "Days per week you can realistically train:", [
    ["2", null, "2"], ["3", null, "3"], ["4", null, "4"], ["5+", null, "5plus"],
  ]),
];

// ─────────────────────────────────────────────
// Scoring
// ─────────────────────────────────────────────
export interface ScoreResult {
  total: number; // /70
  byCategory: Record<CategorySlug, number>; // each /10
  weakest: Category;
}

/** answers = { questionCode: points } for scored questions */
export function scoreAssessment(answers: Record<string, number>, questions: AssessmentQuestion[]): ScoreResult {
  const byCategory = Object.fromEntries(CATEGORIES.map((c) => [c.slug, 0])) as Record<CategorySlug, number>;
  for (const question of questions) {
    if (question.kind !== "scored" || question.category_id == null) continue;
    const pts = answers[question.code];
    if (typeof pts !== "number") continue;
    const cat = CATEGORIES.find((c) => c.id === question.category_id);
    if (cat) byCategory[cat.slug] += pts;
  }
  const total = Object.values(byCategory).reduce((a, b) => a + b, 0);
  // Weakest: lowest score, tie-break by category order
  let weakest: Category = CATEGORIES[0];
  for (const c of CATEGORIES) {
    if (byCategory[c.slug] < byCategory[weakest.slug]) weakest = c;
  }
  return { total, byCategory, weakest };
}

// ─────────────────────────────────────────────
// Score bands (Appendix A)
// ─────────────────────────────────────────────
export interface ScoreBand {
  min: number;
  max: number;
  name: string;
  copy: (weeksRemaining: number | null) => string;
}

export const SCORE_BANDS: ScoreBand[] = [
  { min: 0, max: 24, name: "BUILD PHASE: FOUNDATION",
    copy: () => "Good news: you found this before she found out. Bad news: the clock's already running." },
  { min: 25, max: 44, name: "BUILD PHASE: FRAMING",
    copy: (w) => w != null ? `The structure's up. The house isn't ready for her yet. ${w} weeks.` : "The structure's up. The house isn't ready for her yet." },
  { min: 45, max: 59, name: "BUILD PHASE: FINISHING",
    copy: () => "You're ahead of most men. That's not the standard. She is." },
  { min: 60, max: 70, name: "READY... FOR NOW",
    copy: () => "Strong. Now hold it under pressure — the score resets the day she arrives." },
];

export function getBand(total: number): ScoreBand {
  return SCORE_BANDS.find((b) => total >= b.min && total <= b.max) ?? SCORE_BANDS[0];
}

// ─────────────────────────────────────────────
// Track routing (D1: tracks stay M2F Rebuild / M2F Perform)
// ─────────────────────────────────────────────
export type TrackName = "M2F Rebuild" | "M2F Perform";

export function routeTrack(routing: Record<string, string>): TrackName {
  const exp = routing["R1"];
  const equip = routing["R2"];
  const days = routing["R3"];
  const performEligible =
    exp !== "under_1yr" &&
    (equip === "full_gym" || equip === "home_setup") &&
    (days === "4" || days === "5plus");
  return performEligible ? "M2F Perform" : "M2F Rebuild";
}

// ─────────────────────────────────────────────
// The clock
// ─────────────────────────────────────────────
export function weeksRemaining(dueDate: string | Date | null | undefined): number | null {
  if (!dueDate) return null;
  const due = typeof dueDate === "string" ? new Date(dueDate + "T00:00:00") : dueDate;
  const ms = due.getTime() - Date.now();
  return Math.max(0, Math.ceil(ms / (7 * 24 * 60 * 60 * 1000)));
}

export function countdownParts(dueDate: string | Date | null | undefined): { weeks: number; days: number } | null {
  if (!dueDate) return null;
  const due = typeof dueDate === "string" ? new Date(dueDate + "T00:00:00") : dueDate;
  const totalDays = Math.max(0, Math.ceil((due.getTime() - Date.now()) / (24 * 60 * 60 * 1000)));
  return { weeks: Math.floor(totalDays / 7), days: totalDays % 7 };
}

export function daysAsDad(babyArrivedAt: string | Date | null | undefined): number | null {
  if (!babyArrivedAt) return null;
  const born = typeof babyArrivedAt === "string" ? new Date(babyArrivedAt + "T00:00:00") : babyArrivedAt;
  return Math.max(1, Math.floor((Date.now() - born.getTime()) / (24 * 60 * 60 * 1000)) + 1);
}
