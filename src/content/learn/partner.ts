import type { Lesson } from "./types";

const c = "partner";
function L(l: Lesson): Lesson { return l; }

export const partnerLessons: Lesson[] = [
  L({
    slug: "emotional-support",
    categorySlug: c,
    title: "Emotional Support Without Fixing",
    summary: "Listen. Reflect. Ask what she needs. Don't jump to solutions.",
    minutes: 4,
    weekRange: [4, 40],
    sections: {
      overview: "Most guys default to problem-solving. Pregnancy and early parenthood mostly need presence, validation, and shared load.",
      whyItMatters: "The number one thing partners report needing is to feel heard. Fixing feels like dismissing.",
      steps: [
        "Ask: 'Do you want me to listen or help solve?' Then follow that answer.",
        "Reflect: 'That sounds exhausting.' 'No wonder you're spun up.'",
        "Physical presence: sit next to her, hand on her back, phone down.",
        "Follow up 24 hours later on the thing she was worried about.",
      ],
      commonMistakes: [
        "Silver lining ('at least…').",
        "Comparing ('my mom did four kids…').",
        "Escaping to your phone or the garage.",
      ],
      actionChecklist: [
        "Practice the listen/solve question this week.",
        "Do one 'follow up 24 hours later' this week.",
      ],
      keyTakeaways: [
        "Ask before fixing.",
        "Presence beats performance.",
      ],
    },
    related: ["communication", "mental-load"],
  }),
  L({
    slug: "physical-recovery",
    categorySlug: c,
    title: "Supporting Her Physical Recovery",
    summary: "Weeks of healing. Take load off her body.",
    minutes: 4,
    weekRange: [36, 40],
    sections: {
      overview: "Vaginal and cesarean recovery take weeks. Bleeding, soreness, breast changes, exhaustion. Your job is to remove all physical friction.",
      whyItMatters: "Every step she doesn't have to take, every stair she doesn't have to climb, is a small recovery accelerator.",
      steps: [
        "Peri bottle and pads stocked in every bathroom.",
        "Snacks and water at every feeding spot.",
        "You handle stairs, laundry, groceries, dishes for at least 2 weeks.",
        "No lifting anything heavier than baby for her — enforce it.",
        "Sitz baths and ice pads if provider suggests — you prep them.",
      ],
      safetyTips: [
        "Watch for signs of infection: fever, worsening pain, foul discharge.",
        "Postpartum hemorrhage or preeclampsia symptoms → ER now.",
      ],
      commonMistakes: [
        "Assuming she'll ask for help.",
        "Expecting normal activity by week 2.",
      ],
      actionChecklist: [
        "Recovery caddy stocked in the bathroom.",
        "Your two-week 'chore takeover' plan written down.",
      ],
      keyTakeaways: [
        "Remove friction, don't wait for asks.",
        "Two weeks minimum of full takeover.",
      ],
    },
    related: ["recovery-timeline", "postpartum-support"],
  }),
  L({
    slug: "communication",
    categorySlug: c,
    title: "Communication During Big Change",
    summary: "Short weekly check-ins beat one long fight.",
    minutes: 4,
    weekRange: [4, 40],
    sections: {
      overview: "Pregnancy and newborn life amplify every communication gap. Small structured check-ins keep both people aligned before resentment builds.",
      whyItMatters: "Most postpartum blowups are backlogs of unspoken frustration. Regular small check-ins clear the backlog.",
      steps: [
        "Sunday 15-minute check-in: how are you, what do you need this week, what's on the calendar.",
        "Use 'I feel X when Y' — no accusations.",
        "One appreciation before any concern.",
        "Repeat back what you heard before responding.",
      ],
      commonMistakes: [
        "Bringing up big topics at 11pm.",
        "Waiting for the blowup instead of the check-in.",
      ],
      actionChecklist: [
        "Sunday check-in on the calendar.",
        "Practice one 'repeat back what I heard' this week.",
      ],
      keyTakeaways: [
        "Weekly beats crisis.",
        "Repeat before respond.",
      ],
    },
    related: ["emotional-support", "relationship-changes"],
  }),
  L({
    slug: "mental-load",
    categorySlug: c,
    title: "The Mental Load",
    summary: "The invisible list she's running. Take half. Own it, not manage it.",
    minutes: 4,
    weekRange: [4, 40],
    sections: {
      overview: "Mental load is the invisible work of remembering, planning, and tracking. Even in equal-effort households, moms usually carry most of it.",
      whyItMatters: "'Ask me if you need help' is not carrying load — that's still management. You want ownership.",
      steps: [
        "List every recurring task in the house — appointments, groceries, cleaning, gifts, bills.",
        "Split ownership: whoever owns it decides, remembers, and executes.",
        "Own at least 40% of the list, including some 'default mom' items.",
        "No 'I forgot' twice for the same task.",
      ],
      commonMistakes: [
        "Being the helper instead of the owner.",
        "Making her the project manager for your ownership.",
      ],
      actionChecklist: [
        "Sit down and split the list this week.",
        "Pick 3 recurring tasks to own permanently.",
      ],
      keyTakeaways: [
        "Ownership > helping.",
        "Half the list, permanently.",
      ],
    },
    related: ["acts-of-service", "communication"],
  }),
  L({
    slug: "acts-of-service",
    categorySlug: c,
    title: "Acts of Service That Actually Matter",
    summary: "The unsexy, unphotographed stuff that makes her feel supported.",
    minutes: 3,
    weekRange: [4, 40],
    sections: {
      overview: "The most meaningful acts are usually the least glamorous: dishes done, laundry folded, bathroom clean, dog walked without being asked.",
      whyItMatters: "Grand gestures fade. Unphotographed daily service compounds.",
      steps: [
        "Morning: make coffee/tea the way she likes it, without asking.",
        "Evening: kitchen fully cleaned before bed.",
        "Weekly: one thing on her list she keeps dreading — done.",
        "Do it. Don't announce it.",
      ],
      commonMistakes: [
        "Doing one big thing and expecting a parade.",
        "Waiting for a thank you.",
      ],
      actionChecklist: [
        "Pick one silent daily act this week.",
        "Do one 'thing she dreads' this weekend.",
      ],
      keyTakeaways: [
        "Silent service beats a speech.",
        "Consistency compounds.",
      ],
    },
    related: ["mental-load"],
  }),
  L({
    slug: "relationship-changes",
    categorySlug: c,
    title: "How the Relationship Actually Changes",
    summary: "Roles shift. Sex changes. Priorities move. Name it before it surprises you.",
    minutes: 4,
    weekRange: [4, 40],
    sections: {
      overview: "The relationship will not look like it did. Time collapses, sex changes, identity shifts. Couples who name it navigate it.",
      whyItMatters: "Unspoken change breeds resentment. Named change breeds partnership.",
      steps: [
        "Say out loud: 'This will be hard. We'll both feel far apart at times.'",
        "Reserve one weekly non-negotiable: 30 minutes on the couch, no screens.",
        "Physical touch that isn't sex: hand-holding, head-on-shoulder.",
        "Reintroduce intimacy on her timeline. Don't clock it.",
      ],
      commonMistakes: [
        "Keeping score.",
        "Measuring closeness by sex frequency.",
      ],
      actionChecklist: [
        "Weekly 30-min couch time on calendar.",
        "One non-sex physical touch daily.",
      ],
      keyTakeaways: [
        "Name it, navigate it.",
        "Closeness has many surfaces.",
      ],
    },
    related: ["date-nights", "communication"],
  }),
  L({
    slug: "postpartum-support",
    categorySlug: c,
    title: "Postpartum Support",
    summary: "The first 6 weeks are yours to carry. Protect her sleep, her body, her space.",
    minutes: 5,
    weekRange: [36, 40],
    sections: {
      overview: "The 'fourth trimester' is when new moms are most vulnerable. Your presence and load-bearing is not optional — it's the mission.",
      whyItMatters: "Countries with strong postpartum support have better outcomes on every metric. In the US, you often are the postpartum support system.",
      steps: [
        "Two weeks off work if at all possible. Real off, not laptop-on-couch.",
        "Own night duty at least every other night (bottle) or handle everything but the feed.",
        "Screen for PPD weekly with a real question, not 'you good?'",
        "Guard sleep like an operator — every nap window matters.",
        "Line up meals, cleaning help, or a postpartum doula if budget allows.",
      ],
      safetyTips: [
        "PPD signs past 2 weeks (persistent sadness, hopelessness, intrusive thoughts) → call provider.",
        "Postpartum psychosis (rare but urgent): confusion, hallucinations → ER.",
      ],
      commonMistakes: [
        "Going back to normal at week 2.",
        "Missing PPD signs.",
      ],
      actionChecklist: [
        "Paternity leave planned.",
        "Weekly PPD check-in question.",
        "Meal train or freezer stock ready.",
      ],
      keyTakeaways: [
        "Fourth trimester is real.",
        "You are the postpartum support system.",
      ],
    },
    related: ["recovery-timeline", "physical-recovery"],
  }),
  L({
    slug: "setting-boundaries",
    categorySlug: c,
    title: "Setting Boundaries with Family",
    summary: "You send the message. She doesn't. That's the deal.",
    minutes: 4,
    weekRange: [28, 40],
    sections: {
      overview: "Extended family will have opinions. You send the boundaries — not her. That protects both her energy and the family relationships.",
      whyItMatters: "If she has to enforce boundaries with your family, it becomes 'her problem with them.' You do it, it's 'our decision.'",
      steps: [
        "Discuss with her first: visits, holding baby, feeding advice, sleep advice, unsolicited critique.",
        "Send the group text or make the call — you.",
        "Use 'we've decided…' language.",
        "Restate calmly if pushed back on. No debates.",
      ],
      commonMistakes: [
        "Making her enforce your family's boundaries.",
        "Debating instead of restating.",
      ],
      actionChecklist: [
        "Two 'we've decided' texts sent to family before week 38.",
      ],
      keyTakeaways: [
        "You enforce. She rests.",
        "Restate, don't debate.",
      ],
    },
    related: ["visitors"],
  }),
  L({
    slug: "visitors-partner",
    categorySlug: c,
    title: "Managing Visitors for Her Sanity",
    summary: "You are the bouncer. She is the guest of honor.",
    minutes: 3,
    weekRange: [36, 40],
    sections: {
      overview: "Visitors are a positive if managed and a disaster if not. You run the door.",
      whyItMatters: "She can't rest, feed, or heal with a rotating audience. Managing this is one of the highest-leverage moves you'll make.",
      steps: [
        "Set a 30–60 minute cap on visits, especially week 1.",
        "Nobody sick. Nobody unannounced. Nobody at feeding time unless she says so.",
        "Have exit lines ready: 'She needs to feed / nap now, we'll walk you out.'",
      ],
      commonMistakes: [
        "Letting one visit stretch to three hours.",
        "Not warming visitors up in advance.",
      ],
      actionChecklist: [
        "Visitor rules texted to family before delivery.",
      ],
      keyTakeaways: [
        "You run the door.",
        "Short and controlled protects her.",
      ],
    },
    related: ["visitors", "setting-boundaries"],
  }),
  L({
    slug: "date-nights",
    categorySlug: c,
    title: "Date Nights That Survive a Baby",
    summary: "Small, frequent, low-effort. Not fancy, not rare.",
    minutes: 3,
    weekRange: [4, 40],
    sections: {
      overview: "Once baby is here, a 30-minute couch dinner counts more than a monthly reservation. Make it small and frequent.",
      whyItMatters: "Consistency wins over grandeur. Weekly small dates protect the relationship better than quarterly big ones.",
      steps: [
        "One night a week: phones away, real food, one topic that isn't the baby.",
        "One monthly out-of-house date once baby is 8+ weeks and comfortable with a sitter.",
        "Text her mid-week to look forward to it. Anticipation counts.",
      ],
      commonMistakes: [
        "Waiting for the 'right time' for a big date.",
        "Talking only about baby logistics.",
      ],
      actionChecklist: [
        "Recurring weekly couch-date on the calendar.",
      ],
      keyTakeaways: [
        "Small and often beats fancy and rare.",
      ],
    },
    related: ["relationship-changes"],
  }),
];
