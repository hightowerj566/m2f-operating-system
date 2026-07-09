import type { Lesson } from "./types";

const c = "identity";
function L(l: Lesson): Lesson { return l; }

export const identityLessons: Lesson[] = [
  L({
    slug: "leadership",
    categorySlug: c,
    title: "Leading Your Family",
    summary: "Leadership at home isn't authority. It's clarity, calm, and follow-through.",
    minutes: 4,
    weekRange: [4, 40],
    sections: {
      overview: "Family leadership isn't about being the boss. It's about being the person who names the mission, sets the tone, and does the work first.",
      whyItMatters: "Every family runs better with a calm, clear leader. That job is available. Take it.",
      steps: [
        "Name the family mission out loud (e.g., 'we're the kind of family that…').",
        "Set weekly rhythms: check-in, chores, quality time.",
        "Model what you expect: put your phone down first, cook dinner first, apologize first.",
        "Own the outcome, share the credit.",
      ],
      commonMistakes: [
        "Confusing leadership with control.",
        "Waiting for permission.",
      ],
      actionChecklist: [
        "Write your one-line family mission this week.",
        "Set one recurring weekly family rhythm.",
      ],
      keyTakeaways: [
        "Clarity, calm, follow-through.",
        "Model first.",
      ],
    },
    related: ["responsibility", "building-family-culture"],
  }),
  L({
    slug: "responsibility",
    categorySlug: c,
    title: "Radical Responsibility",
    summary: "If it happens in your home, it's yours to solve. No excuses.",
    minutes: 4,
    weekRange: [4, 40],
    sections: {
      overview: "Radical responsibility means you don't look for who's to blame — you look for what you can do. It's the fastest path to a strong family.",
      whyItMatters: "Blame is expensive. Responsibility compounds. This one mindset shift changes marriages, careers, and kids.",
      steps: [
        "When something goes wrong, ask 'what part of this is mine?'",
        "Say 'I can fix this' before 'this is unfair.'",
        "Own your mood. Don't outsource it to her, work, or traffic.",
        "Apologize fast, cleanly, no 'buts.'",
      ],
      commonMistakes: [
        '"I would if she would…"',
        'Waiting for a fair share of blame before you\'ll change.',
      ],
      actionChecklist: [
        "Catch yourself once this week and switch from blame to responsibility.",
        "Deliver one clean apology.",
      ],
      keyTakeaways: [
        "Your home. Your mission. Your mood.",
      ],
    },
    related: ["leadership", "emotional-regulation"],
  }),
  L({
    slug: "discipline",
    categorySlug: c,
    title: "Personal Discipline as a Dad",
    summary: "The habits that keep you sharp when sleep is broken.",
    minutes: 4,
    weekRange: [4, 40],
    sections: {
      overview: "Discipline isn't intensity. It's showing up small, on the days you don't feel like it.",
      whyItMatters: "Newborn life is the ultimate test of daily standards. The dad you become is built in these months.",
      steps: [
        "Pick 5 non-negotiable daily standards.",
        "Do them tired, sick, and busy.",
        "Track. Don't argue with the checkbox.",
        "Rebuild fast after a miss. No spirals.",
      ],
      commonMistakes: [
        "Setting 15 standards.",
        "Quitting for 3 weeks after one missed day.",
      ],
      actionChecklist: [
        "Confirm your 5 daily standards.",
        "Do them tomorrow whether you feel like it or not.",
      ],
      keyTakeaways: [
        "Small, daily, boring.",
        "Rebuild fast after a miss.",
      ],
    },
    related: ["time-management"],
  }),
  L({
    slug: "confidence",
    categorySlug: c,
    title: "Building Real Confidence",
    summary: "Confidence is evidence you've kept promises to yourself.",
    minutes: 3,
    weekRange: [4, 40],
    sections: {
      overview: "Real confidence isn't hype — it's the stack of small promises you've kept to yourself over time.",
      whyItMatters: "Your kid will inherit your baseline confidence. Build it now.",
      steps: [
        "Make small daily promises you know you can keep.",
        "Keep them. Log them.",
        "Increase promise size slowly.",
        "Speak plainly. Confidence sounds calm, not loud.",
      ],
      commonMistakes: [
        "Faking it externally instead of building it internally.",
      ],
      actionChecklist: [
        "One small daily promise, kept for 30 days.",
      ],
      keyTakeaways: [
        "Kept promises → confidence.",
      ],
    },
    related: ["discipline"],
  }),
  L({
    slug: "identity",
    categorySlug: c,
    title: "Your New Identity as a Father",
    summary: "You don't lose who you were. You add a floor to who you are.",
    minutes: 4,
    weekRange: [4, 40],
    sections: {
      overview: "Becoming a dad doesn't erase you — it adds a new layer of responsibility, meaning, and identity. Guys who fight it stall. Guys who claim it grow.",
      whyItMatters: "How you talk about being a dad shapes how you show up. Language becomes identity.",
      steps: [
        "Say it out loud: 'I'm a father.' Own it.",
        "Keep 1–2 pre-dad identity anchors you don't drop (training, faith, craft).",
        "Let go of the hobbies that don't survive the season.",
        "Write your 3 non-negotiable identity words. Live them.",
      ],
      commonMistakes: [
        "Framing fatherhood as a loss.",
        "Trying to keep every pre-baby thing intact.",
      ],
      actionChecklist: [
        "Write your 3 identity words.",
        "Name one anchor you'll protect.",
      ],
      keyTakeaways: [
        "Add a floor. Don't erase yourself.",
      ],
    },
    related: ["leadership"],
  }),
  L({
    slug: "patience",
    categorySlug: c,
    title: "Patience Under Pressure",
    summary: "Patience is a muscle. Train it before you need it.",
    minutes: 3,
    weekRange: [4, 40],
    sections: {
      overview: "Newborns test patience more than any job ever will. Build the muscle now with small daily reps.",
      whyItMatters: "The dad you are in month 3 sleep debt is who you're becoming. Train patience before it's tested.",
      steps: [
        "Practice the 3-breath pause before responding to anything charged.",
        "Notice your top 3 triggers. Write them down.",
        "Sleep, protein, and hydration make patience easier — protect them.",
        "When you snap, name it fast: 'That was me. Not you. I'm sorry.'",
      ],
      commonMistakes: [
        "Assuming patience is a personality, not a practice.",
      ],
      actionChecklist: [
        "3-breath pause used at least once daily this week.",
      ],
      keyTakeaways: [
        "Muscle, not a mood.",
      ],
    },
    related: ["emotional-regulation"],
  }),
  L({
    slug: "emotional-regulation",
    categorySlug: c,
    title: "Regulating Your Emotions",
    summary: "You can't co-regulate a baby or a wife if you're dysregulated yourself.",
    minutes: 4,
    weekRange: [4, 40],
    sections: {
      overview: "Emotional regulation is the ability to feel a hard emotion without acting on it. It's the foundation of parenting under pressure.",
      whyItMatters: "Kids and partners co-regulate off you. The calmer you are, the calmer they get.",
      steps: [
        "Name the emotion: 'I'm frustrated. I'm tired. I'm scared.'",
        "Take a physiological reset: cold water on face, walk, 4 slow breaths.",
        "Delay response until nervous system settles.",
        "Repair after a misstep. Repair matters more than never messing up.",
      ],
      commonMistakes: [
        "Suppressing instead of regulating.",
        "Skipping repair because 'I already apologized once.'",
      ],
      actionChecklist: [
        "Practice one physiological reset technique this week.",
      ],
      keyTakeaways: [
        "Name it, reset, respond.",
        "Repair matters most.",
      ],
    },
    related: ["patience", "communication"],
  }),
  L({
    slug: "time-management",
    categorySlug: c,
    title: "Time Management After a Baby",
    summary: "Fewer priorities. Bigger buffers. Rituals over willpower.",
    minutes: 4,
    weekRange: [4, 40],
    sections: {
      overview: "Time doesn't shrink after a baby — it just fragments. Winning your time back means fewer things, bigger buffers, and rituals that don't need decisions.",
      whyItMatters: "Time is where marriages die and dads burn out. Rebuilding your calendar is a real project.",
      steps: [
        "Cut the priority list to 3 categories: family, work, health.",
        "Kill or shrink hobbies that don't fit the season.",
        "Batch chores. Do dishes once, not five times.",
        "Build rituals: same morning, same bedtime, same weekly review.",
        "Say no faster and more kindly.",
      ],
      commonMistakes: [
        "Trying to fit pre-baby life into post-baby time.",
        "Waiting for a good week to reset the calendar.",
      ],
      actionChecklist: [
        "One ritual added to your week.",
        "One thing removed from your week.",
      ],
      keyTakeaways: [
        "Fewer, bigger, rhythmic.",
      ],
    },
    related: ["discipline"],
  }),
  L({
    slug: "communication-identity",
    categorySlug: c,
    title: "The Way You Communicate Becomes the Family Culture",
    summary: "Your tone is the room. Set it.",
    minutes: 3,
    weekRange: [4, 40],
    sections: {
      overview: "Your baby learns communication mostly by observation. What you model in tone, listening, and repair becomes their default.",
      whyItMatters: "Culture is built in tiny daily moments. Yours is being watched.",
      steps: [
        "Lower your default volume by 10%.",
        "Full presence for 5 minutes when someone in the family is talking.",
        "Repair conflicts on-camera so your kid sees repair as normal.",
      ],
      commonMistakes: [
        "Being the loudest voice in a small house.",
        "Only doing repair privately.",
      ],
      actionChecklist: [
        "Practice one 'full presence 5 minutes' interaction daily.",
      ],
      keyTakeaways: [
        "Your tone becomes their tone.",
      ],
    },
    related: ["communication", "building-family-culture"],
  }),
  L({
    slug: "building-family-culture",
    categorySlug: c,
    title: "Building the Family Culture You Want",
    summary: "Rituals, sayings, and non-negotiables — designed, not defaulted.",
    minutes: 4,
    weekRange: [4, 40],
    sections: {
      overview: "Family culture will form whether you design it or not. Deciding what your family stands for is one of the highest leverage acts of leadership.",
      whyItMatters: "Design or default. There's no third option.",
      steps: [
        "Write 3 sentences: what we stand for, how we treat each other, what we do together.",
        "Pick 2–3 recurring rituals (Sunday dinner, Friday walk, Saturday morning together).",
        "Pick 1–2 non-negotiables (phones down at meals, we always try, we don't quit on each other).",
        "Revisit and adjust yearly.",
      ],
      commonMistakes: [
        "Assuming culture just happens.",
        "Making it a document instead of a lived thing.",
      ],
      actionChecklist: [
        "Write the 3 sentences with her.",
        "Pick 1 ritual to start now.",
      ],
      keyTakeaways: [
        "Design it or default it.",
      ],
    },
    related: ["leadership", "identity"],
  }),
  L({
    slug: "father-you-want-to-be",
    categorySlug: c,
    title: "Becoming the Father You Want to Be",
    summary: "Name him. Then behave like him today.",
    minutes: 4,
    weekRange: [4, 40],
    sections: {
      overview: "You can't become a father you haven't defined. Get specific. Then live one degree closer to him every day.",
      whyItMatters: "Vague goals produce vague fathers. Specific pictures produce specific action.",
      steps: [
        "Write a paragraph describing the dad you want your kid to describe at 25.",
        "Extract 5 behaviors from that paragraph.",
        "Pick 1 behavior to embody this week.",
        "Ask her monthly: 'Am I becoming him?'",
      ],
      commonMistakes: [
        "Skipping the writing step.",
        "Treating this as a vibe instead of a plan.",
      ],
      actionChecklist: [
        "Write the paragraph.",
        "Pick this week's behavior.",
      ],
      keyTakeaways: [
        "Named man → daily action → real father.",
      ],
    },
    related: ["identity", "leadership"],
  }),
];
