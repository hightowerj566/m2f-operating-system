// M2F OS · Quick lessons — the short, Roadmap-linked lesson format.
// Structure: The Situation → Know This → Your Job → Bottom Line.
// Health/safety lessons always point to qualified professional care.
import type { Lesson } from "./types";

export const quickLessons: Lesson[] = [
  {
    slug: "postpartum-depression",
    categorySlug: "partner",
    title: "Postpartum Depression & Anxiety: What Dad Needs to Know",
    summary: "How to tell normal exhaustion from something that needs help — in her and in you.",
    minutes: 4,
    weekRange: [30, 40],
    postBirthPhases: ["survival", "foundation", "rhythm"],
    keywords: ["ppd", "ppa", "postpartum", "depression", "anxiety", "baby blues", "mental health"],
    related: ["postpartum-support", "emotional-support", "recovery-timeline"],
    reviewStatus: "needs_review",
    quick: {
      situation:
        "Postpartum depression and anxiety are common and treatable — and they often show up while everyone is too tired to notice. You're the person most likely to see it first. You can't diagnose it, but you can spot it and help her get to someone who can.",
      knowThis: [
        { title: "Baby blues vs. something more", body: "Tearfulness, mood swings and feeling overwhelmed in the first two weeks are very common and usually fade. Symptoms that last past two weeks, get worse, or get in the way of daily life are a reason to call her doctor." },
        { title: "Signs to watch for", body: "Persistent sadness or hopelessness, constant worry or panic, pulling away from you or the baby, not sleeping even when the baby sleeps, rage, feeling numb, or saying she's a bad mom or that you'd be better off without her." },
        { title: "Dads get it too", body: "Roughly 1 in 10 new fathers experience depression. Irritability, withdrawing, working all the time or drinking more can be your version. The same rules apply to you." },
        { title: "How to bring it up", body: "Lead with what you've noticed, not a label: \"You've seemed really low for a while. I'm worried about you. Can I call the doctor with you?\" Then offer to make the call and handle the logistics." },
      ],
      safety: [
        "If she (or you) talks about self-harm, harming the baby, or seems confused or out of touch with reality, this is an emergency: call 911 or go to the ER. Don't leave her alone.",
        "988 Suicide & Crisis Lifeline: call or text 988 (US).",
        "National Maternal Mental Health Hotline: call or text 1-833-852-6262 (free, 24/7).",
        "This lesson is general information, not medical advice. Her OB, midwife or doctor is the right person to assess symptoms.",
      ],
      yourJob:
        "Tonight, save her OB's number and the Maternal Mental Health Hotline in your phone. Then ask her one honest question: \"How are you really doing — not the baby, you?\"",
      bottomLine: "Noticing early and making the call for her is love, not overstepping.",
    },
  },
  {
    slug: "pregnancy-warning-signs",
    categorySlug: "pregnancy",
    title: "Pregnancy Warning Signs: When to Call Right Now",
    summary: "The short list of symptoms that mean call her OB or go in — don't wait it out.",
    minutes: 3,
    weekRange: [1, 40],
    keywords: ["warning signs", "preeclampsia", "bleeding", "ob", "emergency", "movement"],
    related: ["what-shes-experiencing", "trimesters-explained"],
    reviewStatus: "needs_review",
    quick: {
      situation:
        "Most pregnancy discomfort is normal. A few symptoms are not — and she may downplay them because she doesn't want to overreact. Knowing the list means you can be the calm voice that says \"let's call.\"",
      knowThis: [
        { title: "Call the OB line now for", body: "Severe or lasting headache, vision changes (blurry, spots, flashing lights), sudden swelling of the face or hands, fever, painful urination, or constant vomiting." },
        { title: "Bleeding or fluid", body: "Any vaginal bleeding beyond light spotting, or fluid leaking or gushing, means call right away." },
        { title: "Baby's movement", body: "Later in pregnancy, if she notices the baby moving noticeably less than usual, call — don't wait until tomorrow." },
        { title: "Go to the ER or call 911 for", body: "Chest pain, trouble breathing, fainting, seizures, severe belly pain, or heavy bleeding." },
      ],
      safety: [
        "When in doubt, call. OB lines exist for exactly this, and nobody there will think you're overreacting.",
        "This is general information, not medical advice. Follow the guidance from her care team.",
      ],
      yourJob: "Put the OB/after-hours number in your favorites today, labeled clearly, and read this list out loud with her once.",
      bottomLine: "You don't have to know what it is — you just have to know when to call.",
    },
  },
  {
    slug: "when-to-go-to-hospital",
    categorySlug: "hospital",
    title: "When It's Time to Go: The 5-1-1 Rule",
    summary: "How to time contractions and know when to call or head in.",
    minutes: 3,
    weekRange: [34, 42],
    keywords: ["5-1-1", "contractions", "labor", "water breaks", "go time", "hospital"],
    related: ["labor-basics", "what-happens-labor", "hospital-bag"],
    reviewStatus: "needs_review",
    quick: {
      situation:
        "When labor starts, the room looks to you for calm. Knowing exactly when to call and when to drive turns panic into a plan.",
      knowThis: [
        { title: "5-1-1", body: "Contractions about 5 minutes apart, each lasting about 1 minute, for 1 hour is the common signal to call and head in. Her provider may give a different rule — theirs wins." },
        { title: "How to time them", body: "Time from the start of one contraction to the start of the next. Use a contraction-timer app so you're not doing math at 2am." },
        { title: "Call right away, regardless of timing", body: "Water breaks (note the time and color), bleeding, the baby moving less, constant severe pain, or a fever." },
        { title: "Early labor is often long", body: "First-time labors can take many hours. Rest, hydrate, eat light, and don't rush in at the first contraction unless told to." },
      ],
      safety: [
        "If she feels an urge to push, the baby seems to be coming, or there's heavy bleeding, call 911.",
        "Follow her OB or midwife's instructions over any general rule.",
      ],
      yourJob: "Download a contraction-timer app now and say 5-1-1 out loud with her tonight — plus the three \"call no matter what\" signs.",
      bottomLine: "Five minutes apart, one minute long, one hour — then call.",
    },
  },
];
