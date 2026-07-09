import type { Lesson } from "./types";

const c = "pregnancy";

export const pregnancyLessons: Lesson[] = [
  {
    slug: "pregnancy-timeline",
    categorySlug: c,
    title: "The Pregnancy Timeline, Week by Week",
    summary: "A 40-week map of what's happening to the baby and to her — so nothing sneaks up on you.",
    minutes: 6,
    weekRange: [4, 40],
    keywords: ["timeline", "weeks", "trimester"],
    sections: {
      overview: "Pregnancy runs about 40 weeks from the last menstrual period, split into three trimesters. Knowing which week she's in tells you what's happening physically, what appointments are coming, and what she needs from you this week.",
      whyItMatters: "You'll never win a 'she wishes you knew this already' moment. Being one week ahead of the calendar means you can prep the room, the appointment, the meal, or the emotional support before she has to ask.",
      steps: [
        "Get the due date and pin it on your phone calendar as Week 40.",
        "Every Sunday night, check what week starts Monday and read the one-page brief.",
        "Add the standard appointments: 8w, 12w, 20w anatomy scan, 24–28w glucose, 28w+ every-two-weeks, 36w+ weekly.",
        "Bookmark the 'red-flag' symptoms list from her provider so you know what warrants a call vs. a wait.",
      ],
      visualExamples: [
        { title: "Trimester 1 (wks 4–13)", body: "Formation. She feels awful and shows nothing. Your job: absorb load, guard sleep, be at the first scan." },
        { title: "Trimester 2 (wks 14–27)", body: "Honeymoon. Energy returns, bump appears. Your job: nursery, budget, registry, a real trip." },
        { title: "Trimester 3 (wks 28–40)", body: "Preparation. Sleep gets rough, patience thin. Your job: logistics, bag, seat, meals, calm." },
      ],
      commonMistakes: [
        "Treating the due date as a deadline instead of a midpoint of a two-week window.",
        "Only tuning in at appointments. Weeks matter every day, not just at ultrasounds.",
        "Learning about a milestone (viability, glucose test) the day of.",
      ],
      actionChecklist: [
        "Put due date + every appointment in your calendar tonight.",
        "Set a Sunday 8pm recurring reminder to read the coming week.",
        "Screenshot the provider's 'call us if…' list and pin it.",
      ],
      keyTakeaways: [
        "40 weeks, 3 trimesters. Know which one and which week she's in.",
        "Weeks 14–27 are your best build window. Use them.",
        "Being one week ahead beats a perfect apology later.",
      ],
    },
    related: ["trimesters-explained", "what-shes-experiencing"],
  },
  {
    slug: "baby-development",
    categorySlug: c,
    title: "How the Baby Actually Develops",
    summary: "From poppy seed to newborn — the milestones that matter and when they happen.",
    minutes: 5,
    weekRange: [4, 40],
    sections: {
      overview: "Baby development follows a predictable pattern: organ formation in the first trimester, growth and movement in the second, and preparing for outside life in the third.",
      whyItMatters: "When you know what the baby is doing this week, kicks, ultrasounds, and appointments stop being abstract. You become a participant, not a spectator.",
      steps: [
        "Weeks 5–8: Heart starts beating; neural tube closes. Take folic acid seriously.",
        "Weeks 9–13: Fully formed miniature, moving but she can't feel it yet.",
        "Weeks 14–20: Senses wiring up. Anatomy scan around 18–20 confirms development.",
        "Weeks 21–27: Hearing, kicking, sleep-wake cycles. Talk to the bump — she'll learn your voice.",
        "Weeks 28–36: Lungs mature, eyes open, dropping into position.",
        "Weeks 37–40: Full term. Just adding fat and waiting.",
      ],
      commonMistakes: [
        "Assuming 'viability' at 24 weeks means 'ready.' It means 'possible with major NICU support.'",
        "Skipping the 20-week anatomy scan or treating it as routine. It's the biggest one.",
      ],
      actionChecklist: [
        "Block the 20-week anatomy scan in ink.",
        "Start talking to the bump at week 23. Feels dumb for 10 seconds, then it doesn't.",
        "Watch one 60-second week-by-week baby development video with her each week.",
      ],
      keyTakeaways: [
        "First trimester: build. Second: grow. Third: prepare.",
        "20-week anatomy scan is the biggest checkpoint.",
        "Talking, music, and touch matter from week 23 onward.",
      ],
    },
    related: ["pregnancy-timeline", "trimesters-explained"],
  },
  {
    slug: "what-shes-experiencing",
    categorySlug: c,
    title: "What Your Partner Is Actually Experiencing",
    summary: "The physical and emotional reality of pregnancy — beyond the movie version.",
    minutes: 5,
    weekRange: [4, 40],
    sections: {
      overview: "Pregnancy is a full-body renovation done while she still has to work, sleep, and function. Hormones spike, organs move, sleep degrades, and identity shifts.",
      whyItMatters: "If you don't know what's normal for her stage, you'll under-respond or over-worry — both of which erode trust. Knowledge lets you meet her where she actually is.",
      steps: [
        "Learn the top 3 physical symptoms per trimester.",
        "Ask weekly: 'What's the hardest thing this week?' — then just listen.",
        "Track patterns: nausea windows, low-energy hours, food aversions. Plan around them.",
        "Never say 'you're just hormonal.' Even if it's true, saying it costs more than it earns.",
      ],
      visualExamples: [
        { title: "T1", body: "Exhaustion, nausea, breast tenderness, mood swings, food aversions." },
        { title: "T2", body: "Energy returns, round-ligament pain, bump, first kicks, emotional relief." },
        { title: "T3", body: "Back pain, sleep loss, swelling, Braxton Hicks, anxiety about delivery." },
      ],
      commonMistakes: [
        "Comparing her pregnancy to someone else's ('my sister ran until 38 weeks').",
        "Assuming a good day means the hard part is over.",
        "Waiting for her to ask for help instead of anticipating.",
      ],
      actionChecklist: [
        "Add the 'what's the hardest thing this week' question to Sunday.",
        "Pre-stock nausea kit: water, crackers, ginger, mint gum.",
        "Take one recurring chore off her plate — permanently.",
      ],
      keyTakeaways: [
        "It's a renovation, not a phase. Respect the load.",
        "Ask weekly, listen fully, act quietly.",
        "Anticipate. Don't audit.",
      ],
    },
    related: ["pregnancy-timeline", "emotional-support"],
  },
  {
    slug: "trimesters-explained",
    categorySlug: c,
    title: "The Three Trimesters, Decoded",
    summary: "What each phase demands from her, and what it demands from you.",
    minutes: 4,
    weekRange: [4, 40],
    sections: {
      overview: "Each trimester has a different mission — for her body, for the baby, and for your prep work. Trying to run the same playbook the whole time is why guys burn out or fall behind.",
      whyItMatters: "The best fathers-to-be adjust their intensity to the phase. High-effort prep in T2. Low-drama support in T3. Full presence at Day One.",
      steps: [
        "T1 (wks 4–13): You're a shock absorber. Do more, ask less, protect sleep.",
        "T2 (wks 14–27): You're the builder. Nursery, money, education, registry, one real trip.",
        "T3 (wks 28–40): You're the operator. Logistics done, calm dialed, phone charged.",
      ],
      commonMistakes: [
        "Trying to 'finalize the plan' in T1 when she can barely stay awake.",
        "Coasting in T2 because she feels good — that's your build window.",
        "Adding chaos in T3: new job, new house, new pet. Just don't.",
      ],
      actionChecklist: [
        "Write down your one main mission for the current trimester.",
        "Cancel any non-essential T3 project starting now.",
      ],
      keyTakeaways: [
        "Different phase = different job.",
        "T2 is the build window. Don't waste it.",
      ],
    },
    related: ["pregnancy-timeline"],
  },
  {
    slug: "labor-basics",
    categorySlug: c,
    title: "Labor, Explained Simply",
    summary: "The three stages of labor and what actually happens in each.",
    minutes: 6,
    weekRange: [28, 40],
    sections: {
      overview: "Labor has three stages: early/active, delivery of the baby, delivery of the placenta. Each has predictable signs and a normal duration range.",
      whyItMatters: "If you can name the stage she's in, you can stop panicking and start supporting. Nurses will assume you know the basics — you'll get better care by speaking the language.",
      steps: [
        "Stage 1 — Early: contractions 5–20 min apart, mild-to-moderate. Stay home, walk, eat, hydrate.",
        "Stage 1 — Active: contractions ~3–5 min apart, 60+ seconds, can't talk through them. Go to hospital.",
        "Stage 1 — Transition: shortest, hardest. She may say 'I can't.' You say 'you already are.'",
        "Stage 2 — Pushing: minutes to hours. Follow the nurse's lead. Feed her ice chips, count with her.",
        "Stage 3 — Placenta: 5–30 minutes after baby. Skin-to-skin is happening. Don't leave the room.",
      ],
      safetyTips: [
        "Water breaking + green/brown fluid → call provider now.",
        "Bleeding heavier than a period, severe headache, or reduced fetal movement → call provider now.",
      ],
      commonMistakes: [
        "Rushing to the hospital in early labor and getting sent home.",
        "Filming everything instead of holding her hand.",
        "Trying to be the coach when she needs a wall to lean on. Ask what she wants.",
      ],
      actionChecklist: [
        "Learn 5-1-1 rule (5 min apart, 1 min long, 1 hour of that pattern) or your provider's variant.",
        "Save provider phone number in favorites.",
        "Do the hospital dry run before week 36.",
      ],
      keyTakeaways: [
        "Three stages, predictable signs, don't panic.",
        "Active labor gets you to the hospital, not the first contraction.",
        "Presence beats performance.",
      ],
    },
    related: ["delivery-basics", "hospital-bag"],
  },
  {
    slug: "delivery-basics",
    categorySlug: c,
    title: "Delivery Basics",
    summary: "Vaginal vs. cesarean, interventions, and what your job looks like in each.",
    minutes: 6,
    weekRange: [30, 40],
    sections: {
      overview: "Most deliveries are vaginal, some become cesarean. Interventions (epidural, Pitocin, forceps, vacuum, C-section) exist on a spectrum and are usually offered because of a specific reason.",
      whyItMatters: "A calm partner who knows the options is worth more than any birth plan. Understanding the tools means you can advocate without panicking.",
      steps: [
        "Learn the difference between planned and emergency C-section.",
        "Know what an epidural is, when it's offered, and its trade-offs.",
        "Understand that 'birth plan' is a preference doc, not a contract.",
        "Ask providers 'what are the risks, benefits, and alternatives' — the BRAIN framework.",
      ],
      commonMistakes: [
        "Treating a C-section as 'failure.' It's a delivery.",
        "Arguing with the team mid-emergency because it wasn't in the plan.",
      ],
      actionChecklist: [
        "Discuss preferences: pain management, who catches, delayed cord clamping, skin-to-skin.",
        "Ask your provider what percentage of their births are C-sections — know the norm.",
      ],
      keyTakeaways: [
        "Every delivery is a valid delivery.",
        "Plans are preferences, not contracts.",
        "Ask BRAIN questions to stay involved without being combative.",
      ],
    },
    related: ["labor-basics", "birth-plan"],
  },
  {
    slug: "recovery-timeline",
    categorySlug: c,
    title: "Her Recovery Timeline",
    summary: "What the fourth trimester actually looks like — day, week, month.",
    minutes: 5,
    weekRange: [36, 40],
    sections: {
      overview: "Recovery is 6 weeks minimum for the uterus, months for the pelvic floor, and longer for hormones and identity. Expect bleeding (lochia), soreness, night sweats, and huge emotional swings.",
      whyItMatters: "Most guys think 'she had the baby, now we're back.' She isn't. Understanding recovery keeps you from missing warning signs — and from adding pressure she doesn't need.",
      steps: [
        "Days 0–3: hospital or immediate postpartum. She's shaking, bleeding, learning to feed.",
        "Week 1–2: baby blues peak. Sleep is broken. Meals should not be her problem.",
        "Week 2–6: physical healing, pelvic floor rebuild starts. No lifting anything heavier than the baby.",
        "6-week checkup: 'clearance' is a physical checkbox, not permission for normal life.",
        "Months 2–6: hormones re-regulate, sleep slowly improves.",
      ],
      safetyTips: [
        "Signs of postpartum hemorrhage, preeclampsia, or PPD → call provider immediately.",
        "Persistent sadness, hopelessness, or intrusive thoughts past 2 weeks → not baby blues. Call.",
      ],
      commonMistakes: [
        "Asking about sex at the 6-week appointment.",
        "Assuming 'cleared' means 'healed.'",
        "Missing early PPD signs because you're tired too.",
      ],
      actionChecklist: [
        "Own all meals, laundry, and visitor management for the first two weeks.",
        "Screen for PPD weekly with one question: 'How are you, really?'",
      ],
      keyTakeaways: [
        "The fourth trimester is real. Treat it like a trimester.",
        "Cleared ≠ healed.",
        "Watch for PPD. Ask real questions.",
      ],
    },
    related: ["postpartum-support", "emotional-support"],
  },
];
