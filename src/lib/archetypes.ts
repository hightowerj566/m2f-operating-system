export interface Archetype {
  id: string;
  name: string;
  identity: string;
  mirror: string;
  strength: string;
  edge: string;
  programBridge: string;
  programPreview: [string, string, string];
  ctaLabel: string;
}

const ARCHETYPES: Record<string, Archetype> = {
  marathon_dad: {
    id: "marathon_dad",
    name: "The Marathon Dad",
    identity:
      "Built for the long game. Consistent, grounded — and quietly carrying more than anyone knows.",
    mirror:
      "You tend to show up every single day without anyone asking you to. You don't complain, you don't quit, and you rarely slow down. But somewhere in the last year, you started running on fumes and calling it discipline. You've convinced yourself that grinding harder is the answer — even when your body and your patience are telling you otherwise. The truth is, you're not tired because you're weak. You're tired because you never stop.",
    strength:
      "You model relentless consistency for your kids — they see a father who never gives up.",
    edge:
      "Every marathon runner hits the wall. Yours is asking for help before you're empty.",
    programBridge:
      "The Man to Father program is designed for exactly where you are — not to motivate you, but to make sure you don't run out of road. Here's what's inside.",
    programPreview: [
      "A training structure that matches your pace — intense but sustainable",
      "A recovery system designed for dads who don't know how to slow down",
      "A community of fathers running the same race you are",
    ],
    ctaLabel: "Start My Marathon Dad Program",
  },
  comeback_kid: {
    id: "comeback_kid",
    name: "The Comeback Kid",
    identity:
      "You've been away from yourself for a while. This isn't starting over — it's coming home.",
    mirror:
      "You used to feel strong. Maybe it was before the kids, maybe it was before the career took over. Either way, you look in the mirror now and barely recognize the guy staring back. You've tried to start again — maybe a few times — but life keeps pulling you off course. The hardest part isn't the workouts. It's the voice in your head that says you waited too long. You didn't. You're here now, and that takes more courage than most people will ever understand.",
    strength:
      "You teach your kids that it's never too late to fight for yourself — and mean it.",
    edge:
      "Your comeback doesn't need more motivation. It needs a system that won't let you disappear again.",
    programBridge:
      "The Man to Father Rebuild program was built for this exact moment — not to shame you into action, but to give you a path back to the man your kids already believe you are. Here's what's inside.",
    programPreview: [
      "A progressive system that meets you where you are — not where you used to be",
      "Daily check-ins that keep you accountable without overwhelming you",
      "A brotherhood of dads who've made the same comeback you're starting",
    ],
    ctaLabel: "Start My Comeback Program",
  },
  quiet_workhorse: {
    id: "quiet_workhorse",
    name: "The Quiet Workhorse",
    identity:
      "Head down, work done, no fanfare. You don't need applause — but you do need a plan worthy of your effort.",
    mirror:
      "You show up to the gym the way you show up to everything else — quietly and without excuses. You've been consistent longer than most, and you've built a respectable foundation. But lately, you've noticed the returns slowing down. You're doing the work, but you're not sure the work is doing enough. You don't talk about it because that's not your style. But the frustration of spinning your wheels when you know you're capable of more? That's real. And it's time to fix it.",
    strength:
      "Your kids have a father who proves that showing up — even when no one's watching — is what real strength looks like.",
    edge:
      "The workhorse doesn't need more effort. He needs smarter programming that finally matches his discipline.",
    programBridge:
      "The Man to Father program is built for men like you — the ones who don't need motivation, they need a system that respects their work ethic and actually delivers results. Here's what's inside.",
    programPreview: [
      "Periodized programming that breaks through plateaus — not just more volume",
      "Performance tracking that shows you exactly where your effort is paying off",
      "A crew of disciplined fathers who train with the same quiet intensity you do",
    ],
    ctaLabel: "Start My Workhorse Program",
  },
  all_in_dad: {
    id: "all_in_dad",
    name: "The All-In Dad",
    identity:
      "You don't do anything halfway. When you commit, you go full send — in the gym, at home, in life.",
    mirror:
      "You're the dad who signed up for the 5K and ran a half marathon. You built the home gym and then trained in it at 5 AM before anyone woke up. You've got drive that most people only talk about. But here's what no one tells the all-in guy: going full throttle in every direction eventually pulls you apart. You've felt it — the guilt of choosing the gym over bedtime, or choosing family over your own health. You don't need to do less. You need a system that channels everything you've got without burning you out.",
    strength:
      "Your kids see a father who attacks life with everything he has — and that fire is contagious.",
    edge:
      "The all-in dad doesn't need more intensity. He needs a framework that keeps his fire from burning the house down.",
    programBridge:
      "The Man to Father Perform program is engineered for your energy — it doesn't try to tame you, it gives you a system that can actually keep up. Here's what's inside.",
    programPreview: [
      "Hybrid training that feeds your competitive edge — strength, conditioning, and performance",
      "A structure that channels your intensity so nothing gets left behind",
      "A tribe of high-drive fathers who understand that 'balance' isn't about doing less",
    ],
    ctaLabel: "Start My All-In Program",
  },
  grinder: {
    id: "grinder",
    name: "The Grinder",
    identity:
      "You don't have ideal conditions. You never have. And you build anyway.",
    mirror:
      "You're working with what you've got — limited time, limited equipment, maybe limited energy by the time the kids are asleep. But you still find a way to get something done. The problem isn't your willpower. It's that every program you've tried was built for someone with more time, more gear, or fewer responsibilities. You've been forcing someone else's plan to fit your life, and it keeps breaking. You don't need a perfect setup. You need a program that was designed for the constraints you actually live in.",
    strength:
      "Your kids watch you build something from nothing — and that resourcefulness will shape who they become.",
    edge:
      "The grinder doesn't need more grit. He needs a program that finally works inside his real life — not around it.",
    programBridge:
      "The Man to Father Rebuild program was built for dads in the trenches — not the ones with two free hours and a fully stocked gym. It's designed to work inside your actual life. Here's what's inside.",
    programPreview: [
      "Workouts built for real-world constraints — garage gym, limited gear, tight schedule",
      "A flexible system that adapts to your week instead of demanding perfection",
      "A community of dads who know that showing up imperfectly still counts",
    ],
    ctaLabel: "Start My Grinder Program",
  },
};

export interface QuizAnswers {
  training_experience: string;
  body_composition: string;
  goal: string;
  equipment: string;
  conditioning: string;
}

export function determineArchetype(answers: QuizAnswers): Archetype {
  const { training_experience, body_composition, goal, conditioning } = answers;

  // Comeback Kid: beginner + higher BF + fat loss + poor conditioning
  if (
    training_experience === "beginner" &&
    (body_composition === "dadbod" || body_composition === "high") &&
    conditioning === "poor"
  ) {
    return ARCHETYPES.comeback_kid;
  }

  // Grinder: limited equipment OR (beginner/intermediate + poor/average conditioning + fat_loss)
  if (
    answers.equipment === "limited" &&
    (training_experience === "beginner" || training_experience === "intermediate")
  ) {
    return ARCHETYPES.grinder;
  }

  // All-In Dad: good/athletic conditioning + performance or hybrid goal + lean/moderate BF
  if (
    (conditioning === "good" || conditioning === "athletic") &&
    (goal === "performance" || goal === "hybrid") &&
    (body_composition === "lean" || body_composition === "moderate")
  ) {
    return ARCHETYPES.all_in_dad;
  }

  // Quiet Workhorse: intermediate/advanced + muscle goal + average+ conditioning
  if (
    (training_experience === "intermediate" || training_experience === "advanced") &&
    goal === "muscle" &&
    conditioning !== "poor"
  ) {
    return ARCHETYPES.quiet_workhorse;
  }

  // Marathon Dad: intermediate/advanced, moderate BF, average+ conditioning
  if (
    (training_experience === "intermediate" || training_experience === "advanced") &&
    (conditioning === "average" || conditioning === "good")
  ) {
    return ARCHETYPES.marathon_dad;
  }

  // Fallback: Comeback Kid for high BF / poor conditioning, otherwise Marathon Dad
  if (body_composition === "dadbod" || body_composition === "high" || conditioning === "poor") {
    return ARCHETYPES.comeback_kid;
  }

  return ARCHETYPES.marathon_dad;
}

export { ARCHETYPES };
