// M2F OS · Reusable conversation guides for TALK Roadmap tasks.
// A guide can be linked from multiple Roadmap tasks.

export interface ConversationGuide {
  slug: string;
  title: string;
  pillar: string;
  minutes: number;
  opener: string;
  followUps: string[];
  decide: string;
}

export const CONVERSATION_GUIDES: ConversationGuide[] = [
  {
    slug: "first-week-home",
    title: "Plan Your First Week Home",
    pillar: "Partner Strong",
    minutes: 10,
    opener: "What would make you feel most supported during our first week home?",
    followUps: [
      "What are you most nervous about?",
      "Who do you want visiting — and who can wait?",
      "What would you rather I handle without you having to ask?",
      "How should we handle nighttime responsibilities?",
    ],
    decide: "Agree on the three jobs that are 100% yours that first week.",
  },
  {
    slug: "support-role",
    title: "What Are You Afraid I Won't Do?",
    pillar: "Partner Strong",
    minutes: 5,
    opener: "What are you most afraid I won't do once the baby is here?",
    followUps: [
      "What does 'supported' look like to you on a hard day?",
      "When I get stressed, what do you need me to do instead of going quiet?",
      "Is there something I do now that you'd want me to keep doing no matter what?",
    ],
    decide: "Write down her answer and one specific change you'll make.",
  },
  {
    slug: "visitor-plan",
    title: "Set the Visitor Plan",
    pillar: "Partner Strong",
    minutes: 5,
    opener: "Who do you actually want to see in the first two weeks — and for how long?",
    followUps: [
      "How do you want to handle our moms in the first few days?",
      "Should visitors bring food, help, or just stay short?",
      "What's our signal when you're done and want people to leave?",
    ],
    decide: "Agree on the visitor rules — and that you're the one who delivers the message.",
  },
  {
    slug: "night-shifts",
    title: "Split the Nights",
    pillar: "Partner Strong",
    minutes: 5,
    opener: "How should we split nights so each of us gets one real block of sleep?",
    followUps: [
      "Which part of the night is hardest for you?",
      "If you're feeding, what can I own — diapers, burping, resettling?",
      "How do we tell each other we're hitting a wall?",
    ],
    decide: "Pick the shift times and who's on first tonight.",
  },
  {
    slug: "weekly-check-in",
    title: "The Weekly Check-In",
    pillar: "Partner Strong",
    minutes: 15,
    opener: "How are you really doing this week — not the baby, you?",
    followUps: [
      "What's one thing I did this week that actually helped?",
      "What's weighing on you that you haven't said yet?",
      "What's the one logistics item we need to handle this week?",
    ],
    decide: "Agree on one thing each of you will do before next week's check-in.",
  },
  {
    slug: "parenting-values",
    title: "Talk Parenting Values",
    pillar: "Partner Strong",
    minutes: 15,
    opener: "What did your parents get right that you want us to keep?",
    followUps: [
      "What do you want us to do differently than how you grew up?",
      "How do you want to handle discipline, screens, faith and money?",
      "What's one tradition you want us to start in the first year?",
    ],
    decide: "Agree on one value you'll both protect, no matter what.",
  },
  {
    slug: "say-the-fear",
    title: "Say the Fear Out Loud",
    pillar: "Partner Strong",
    minutes: 5,
    opener: "Can I tell you the thing I'm most nervous about with becoming a dad?",
    followUps: [
      "What's the biggest fear you're carrying right now?",
      "Is there anything about this you've been holding in alone?",
      "What would help either of us feel more ready?",
    ],
    decide: "Pick one small step that makes your biggest fear feel more handled.",
  },
];

export function findGuide(slug: string): ConversationGuide | undefined {
  return CONVERSATION_GUIDES.find((g) => g.slug === slug);
}
