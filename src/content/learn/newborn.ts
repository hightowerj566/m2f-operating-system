import type { Lesson } from "./types";

const c = "newborn";

function L(l: Lesson): Lesson { return l; }

export const newbornLessons: Lesson[] = [
  L({
    slug: "holding-a-newborn",
    categorySlug: c,
    title: "How to Hold a Newborn",
    summary: "Support the head, get comfortable, and stop being afraid of your own daughter.",
    minutes: 3,
    weekRange: [36, 40],
    sections: {
      overview: "Newborns can't support their own heads for ~3 months. Every hold supports the head and neck. Beyond that, it's just practice.",
      whyItMatters: "Confidence transfers. She can feel it in your arms. So can the baby.",
      steps: [
        "Cradle hold: baby's head in the crook of your elbow, body along your forearm.",
        "Shoulder hold: baby upright, head on your shoulder, one hand supporting head/neck, one under bottom.",
        "Football hold: baby along your forearm, head in your palm — great for feeding.",
        "Skin-to-skin: shirt off, baby chest-to-chest with a blanket over back.",
      ],
      safetyTips: [
        "Never shake a baby. Ever.",
        "Head and neck get supported until baby can lift head unassisted (~3 months).",
      ],
      commonMistakes: [
        "Being so tense you make the baby fussy.",
        "Passing baby off the second she cries. She's fine with you.",
      ],
      actionChecklist: [
        "Do 30 minutes of skin-to-skin daily in week 1.",
        "Practice all three holds in the first week.",
      ],
      keyTakeaways: [
        "Support the head. Relax the arms.",
        "Confidence is a gift to both of them.",
      ],
    },
    related: ["swaddling", "soothing-techniques"],
  }),
  L({
    slug: "diaper-changes",
    categorySlug: c,
    title: "Diaper Changes, Efficiently",
    summary: "10 diapers a day. Get it under 90 seconds without drama.",
    minutes: 4,
    weekRange: [36, 40],
    sections: {
      overview: "Newborns go through 8–12 diapers a day. Efficient changes save your back, her sleep, and your sanity.",
      whyItMatters: "Every minute you're not fumbling with tabs is a minute you're not adding stress to a crying baby.",
      steps: [
        "Set up: fresh diaper open under the current one before you remove.",
        "Wipe front to back, especially for girls.",
        "Air-dry a few seconds; apply diaper cream if red.",
        "Boys: point down before closing. Girls: quick clean of folds.",
        "Tabs even, two fingers can fit at the waist.",
        "Roll old diaper into itself using the tabs; toss.",
      ],
      safetyTips: [
        "Never leave baby unattended on a changing table.",
        "Cord stump: fold diaper below it until it falls off (7–21 days).",
      ],
      commonMistakes: [
        "Forgetting to unfold the ruffled leg edges — leaks.",
        "Under-tightening tabs → blowouts.",
      ],
      actionChecklist: [
        "Stock every changing station with diapers, wipes, cream, extra outfit.",
        "Do the first 20 changes yourself. Get reps.",
      ],
      keyTakeaways: [
        "Prep first, execute fast.",
        "Every change is a rep. Get them.",
      ],
    },
    related: ["safe-sleep", "reading-baby-cues"],
  }),
  L({
    slug: "swaddling",
    categorySlug: c,
    title: "Swaddling Like a Nurse",
    summary: "Tight around the arms, loose at the hips. That's the whole game.",
    minutes: 3,
    weekRange: [36, 40],
    sections: {
      overview: "Swaddling mimics the womb and calms the startle reflex. Do it tight up top and loose at the hips.",
      whyItMatters: "A good swaddle can add hours of sleep. A bad one is a hip risk.",
      steps: [
        "Diamond blanket, top corner folded down.",
        "Baby on center, shoulders at fold.",
        "Right arm down, wrap tight across, tuck under baby's left side.",
        "Bottom corner up over feet, tuck.",
        "Left arm down, wrap tight across, tuck under body.",
        "Legs should be able to bend up and out at the hips (frog position).",
      ],
      safetyTips: [
        "Stop swaddling when baby shows signs of rolling (~2–4 months).",
        "Hips loose to prevent hip dysplasia.",
      ],
      commonMistakes: [
        "Tight legs — hip risk.",
        "Loose top — arms escape and startle wakes baby.",
      ],
      actionChecklist: [
        "Learn one swaddle. Practice on a doll or towel.",
        "Buy 3 velcro sleep sacks as a backup.",
      ],
      keyTakeaways: [
        "Tight arms, loose hips.",
        "Sleep sack is a fine cheat code.",
      ],
    },
    related: ["safe-sleep", "soothing-techniques"],
  }),
  L({
    slug: "burping",
    categorySlug: c,
    title: "Burping a Newborn",
    summary: "Three positions, gentle pats, and patience.",
    minutes: 3,
    weekRange: [36, 40],
    sections: {
      overview: "Trapped air makes babies fussy. Burp during and after feeds using one of three positions.",
      whyItMatters: "Un-burped babies spit up more, sleep less, and fuss more.",
      steps: [
        "Over the shoulder: baby upright on your shoulder, gentle pats on back.",
        "Sitting on lap: support chin with palm, lean baby slightly forward, pat back.",
        "Face down on lap: baby across your knees, support head, pat back.",
        "Alternate between pat and rub in circles.",
      ],
      commonMistakes: [
        "Slapping instead of firm gentle pats.",
        "Giving up too fast — sometimes it takes 5 minutes.",
      ],
      actionChecklist: [
        "Burp cloth on your shoulder — always.",
        "Try 5 minutes per position before switching.",
      ],
      keyTakeaways: [
        "Three positions. Firm and patient.",
        "Burp mid-feed and after.",
      ],
    },
    related: ["bottle-feeding", "breastfeeding-support"],
  }),
  L({
    slug: "bottle-feeding",
    categorySlug: c,
    title: "Bottle Feeding",
    summary: "Paced bottle feeding — the technique that protects breastfeeding.",
    minutes: 4,
    weekRange: [36, 40],
    sections: {
      overview: "Paced feeding lets baby control the flow, like nursing. It reduces overfeeding and preserves the latch.",
      whyItMatters: "Bottle feeding is often your job. Do it right and you support her feeding goals — and get a bonding ritual.",
      steps: [
        "Baby upright, not reclined.",
        "Bottle horizontal, tip just filled with milk.",
        "Let baby pull the nipple in.",
        "Pause every 20–30 seconds by tipping the bottle down.",
        "Switch sides mid-feed like nursing.",
        "Watch for cues: 'done' looks like slowed sucking, hands relaxed.",
      ],
      safetyTips: [
        "Never prop a bottle.",
        "Test milk temp on your wrist — warm, not hot.",
      ],
      commonMistakes: [
        "Fast-flow nipples too early.",
        "Chasing an ounce count instead of watching cues.",
      ],
      actionChecklist: [
        "Learn paced feeding before day one.",
        "Take at least one night feed to protect her sleep block.",
      ],
      keyTakeaways: [
        "Pace it. Follow cues.",
        "Bottle feeding is your bonding ritual too.",
      ],
    },
    related: ["burping", "breastfeeding-support", "safe-sleep"],
  }),
  L({
    slug: "breastfeeding-support",
    categorySlug: c,
    title: "How to Support Breastfeeding",
    summary: "You don't nurse. You still have a big job.",
    minutes: 5,
    weekRange: [36, 40],
    sections: {
      overview: "Breastfeeding is a two-person job with one nipple. Your role: setup, hydration, food, lactation help, protecting the environment.",
      whyItMatters: "Feeding is where a lot of moms feel most alone. You being on it is the difference between 'we did this' and 'I did this alone.'",
      steps: [
        "Learn latch basics: wide mouth, lower lip flanged, no clicking sounds.",
        "Bring water and snacks to every feed. She'll get thirsty and hungry hard.",
        "Handle burping and diaper after each feed so she can sleep.",
        "Book a lactation consultant appointment for day 3–5.",
        "Know common issues: engorgement, cracked nipples, mastitis — and when to call.",
      ],
      commonMistakes: [
        "Suggesting formula the first hard night. It might be right — but not as your first move.",
        "Falling asleep during her feed and leaving her without support.",
      ],
      actionChecklist: [
        "Water bottle + snack at every feeding station.",
        "Lactation appointment booked before discharge.",
      ],
      keyTakeaways: [
        "You're the pit crew.",
        "Book a lactation consultant early — don't wait for a crisis.",
      ],
    },
    related: ["bottle-feeding", "postpartum-support"],
  }),
  L({
    slug: "bathing",
    categorySlug: c,
    title: "Bathing a Newborn",
    summary: "Sponge baths until the cord falls off, then a quick tub.",
    minutes: 3,
    weekRange: [36, 40],
    sections: {
      overview: "Newborns don't need daily baths. 2–3 times a week is plenty. Sponge bath until the umbilical cord stump falls off (7–21 days).",
      whyItMatters: "Baths are bonding rituals — and slippery, cold babies cry. Do them well.",
      steps: [
        "Room warm (~75°F). Everything at arm's reach before you start.",
        "Water warm (~100°F), tested with elbow, 2 inches deep max.",
        "Wash face first with plain water, then body top-down, genitals last.",
        "Support head and neck constantly.",
        "Wrap fast in a hooded towel.",
      ],
      safetyTips: [
        "Never step away from a baby in water. Ever. Even for a second.",
        "No baby oils or bubble bath first weeks.",
      ],
      commonMistakes: [
        "Filling the tub too deep.",
        "Room too cold.",
      ],
      actionChecklist: [
        "Bath supplies staged in a caddy.",
        "You do the first three baths.",
      ],
      keyTakeaways: [
        "2–3 baths per week is plenty.",
        "Never step away.",
      ],
    },
    related: ["safe-sleep"],
  }),
  L({
    slug: "safe-sleep",
    categorySlug: c,
    title: "Safe Sleep",
    summary: "ABCs: Alone, on Back, in a Crib. Non-negotiable.",
    minutes: 4,
    weekRange: [30, 40],
    sections: {
      overview: "Safe sleep dramatically reduces SIDS risk. The rules are simple: Alone, on Back, in a Crib. Nothing in the crib but baby.",
      whyItMatters: "This is the single most important safety topic. Get it right every single sleep.",
      steps: [
        "Every sleep: back sleeping, flat firm surface, in a crib/bassinet, in your room for the first 6 months.",
        "Zero: blankets, bumpers, pillows, toys, positioners, sleep wedges.",
        "Room temp cool (~68–72°F). Sleep sack instead of blanket.",
        "Pacifier at sleep is fine.",
        "No smoking near baby, ever.",
      ],
      safetyTips: [
        "No bed sharing, no couch sleeping with baby.",
        "If baby falls asleep in a car seat or swing, move to a flat surface.",
      ],
      commonMistakes: [
        "'Just this once' on the couch.",
        "Loose swaddle in the crib.",
      ],
      actionChecklist: [
        "Crib checked: nothing in it.",
        "Sleep sacks bought (3 minimum).",
        "House thermostat set for baby range.",
      ],
      keyTakeaways: [
        "Alone. Back. Crib. Every time.",
        "This is the non-negotiable.",
      ],
    },
    related: ["swaddling", "nursery-setup"],
  }),
  L({
    slug: "soothing-techniques",
    categorySlug: c,
    title: "Soothing a Crying Baby",
    summary: "The 5 S's — swaddle, side, shush, swing, suck.",
    minutes: 4,
    weekRange: [36, 40],
    sections: {
      overview: "Dr. Harvey Karp's 5 S's mimic the womb and calm most newborns. Layer them until baby settles.",
      whyItMatters: "A calm baby means a calm mom, which means a calm house. This is a superpower.",
      steps: [
        "Swaddle: snug arms.",
        "Side/Stomach hold: while awake and held — not for sleep.",
        "Shush: loud shushing near ear, or white noise machine.",
        "Swing: small fast jiggle motion, not big rocking.",
        "Suck: pacifier or clean finger.",
      ],
      safetyTips: [
        "Side/stomach hold is for holding awake only. Sleep is on back.",
        "If frustration rises, put baby down safely in crib and step out for 5 minutes.",
      ],
      commonMistakes: [
        "Trying one S half-heartedly. Layer all five.",
        "Bouncing too gently — jiggle is small and fast.",
      ],
      actionChecklist: [
        "Buy a white noise machine.",
        "Practice 5 S's in the first week.",
      ],
      keyTakeaways: [
        "Swaddle, Side, Shush, Swing, Suck.",
        "Never shake. Put down and step away if you're at the edge.",
      ],
    },
    related: ["swaddling", "reading-baby-cues"],
  }),
  L({
    slug: "tummy-time",
    categorySlug: c,
    title: "Tummy Time",
    summary: "Short, frequent, awake. Builds neck strength and prevents flat head.",
    minutes: 3,
    weekRange: [36, 40],
    sections: {
      overview: "Tummy time is any time baby is on stomach while awake and supervised. Start day 1 with 1–2 minutes at a time.",
      whyItMatters: "Builds neck, shoulder, arm strength. Prevents flat spots from back-sleeping.",
      steps: [
        "On your chest counts — great starting point.",
        "Flat mat with a mirror or toy at eye level.",
        "1–2 minutes, several times a day, build to 15–30 minutes total daily by 2 months.",
        "Stop if baby is truly distressed. Try again later.",
      ],
      commonMistakes: [
        "Only doing it once a day.",
        "Confusing tired crying with 'they hate it.'",
      ],
      actionChecklist: [
        "Tummy time mat in the living room.",
        "Aim for 3 short sessions daily.",
      ],
      keyTakeaways: [
        "Short. Frequent. Awake.",
        "Chest counts. Start day one.",
      ],
    },
    related: ["holding-a-newborn"],
  }),
  L({
    slug: "reading-baby-cues",
    categorySlug: c,
    title: "Reading Baby Cues",
    summary: "Hungry, tired, overstimulated, uncomfortable — learn the tells.",
    minutes: 4,
    weekRange: [36, 40],
    sections: {
      overview: "Babies communicate before they cry. Early cues let you meet needs before frustration escalates.",
      whyItMatters: "Every cue you catch early is a meltdown you skipped.",
      steps: [
        "Hunger (early): rooting, hand to mouth, smacking lips. (Late): crying.",
        "Tired: rubbing eyes, yawning, staring off, red brows.",
        "Overstimulated: turning head away, arching back, crying.",
        "Discomfort: pulling legs up, grimacing, straining.",
      ],
      commonMistakes: [
        "Waiting for crying to feed.",
        "Adding more stimulation to an overstimulated baby.",
      ],
      actionChecklist: [
        "Track eat/sleep/diaper the first two weeks — patterns emerge fast.",
      ],
      keyTakeaways: [
        "Cues come before cries.",
        "Match your response to the cue.",
      ],
    },
    related: ["soothing-techniques", "safe-sleep"],
  }),
];
