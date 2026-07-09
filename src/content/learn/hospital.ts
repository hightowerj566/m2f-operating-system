import type { Lesson } from "./types";

const c = "hospital";

// Compact helper to keep lessons dense but readable.
function L(l: Lesson): Lesson { return l; }

export const hospitalLessons: Lesson[] = [
  L({
    slug: "hospital-bag",
    categorySlug: c,
    title: "Pack the Hospital Bag Like a Pro",
    summary: "Three bags — hers, yours, baby's — packed by week 34, staged by the door.",
    minutes: 5,
    weekRange: [28, 38],
    sections: {
      overview: "You need three bags packed by week 34: her bag (comfort + recovery), your bag (endurance), baby's bag (going home).",
      whyItMatters: "Labor doesn't wait for you to remember your phone charger. A staged bag turns 'the moment' from panic into procedure.",
      steps: [
        "Her bag: nursing bras, robe, slippers, dark towel, toiletries, glasses/contacts, phone charger, chapstick, snacks, going-home outfit (pregnancy-size, not pre-baby).",
        "Your bag: 3 days of clothes, toothbrush, deodorant, snacks, phone charger + battery pack, water bottle, cash for parking/vending, jacket, ID + insurance card.",
        "Baby bag: two going-home outfits (one newborn, one 0–3m), swaddle, hat, mittens, socks, installed car seat with instructions inside.",
        "Documents: ID, insurance, birth plan, pediatrician contact, pre-registration confirmation.",
        "Stage all three by the door where you literally trip over them.",
      ],
      visualExamples: [
        { title: "The 'don't forget' 3", body: "Phone charger. Insurance card. Snacks." },
        { title: "Pro tip", body: "Pack a dark towel for the car — water can break anywhere." },
      ],
      commonMistakes: [
        "Packing perfumed anything (nausea trigger).",
        "Forgetting your own snacks — hospital cafeterias close.",
        "Buying a going-home outfit that doesn't fit her postpartum body.",
      ],
      actionChecklist: [
        "Bags packed by week 34.",
        "Car seat installed and inspection scheduled by week 34.",
        "Photo of insurance card saved to both phones.",
      ],
      keyTakeaways: [
        "Three bags, staged, by week 34.",
        "Pack for endurance, not aesthetics.",
        "Documents win time when it counts.",
      ],
    },
    related: ["important-documents", "car-seat-basics"],
  }),
  L({
    slug: "birth-plan",
    categorySlug: c,
    title: "The One-Page Birth Plan",
    summary: "Preferences, not a script. Keep it short so the nurses will actually read it.",
    minutes: 4,
    weekRange: [30, 38],
    sections: {
      overview: "A birth plan is a one-page cheat sheet for the team. It covers pain management, environment, and post-delivery preferences.",
      whyItMatters: "A concise plan gets read and respected. A three-page manifesto gets ignored.",
      steps: [
        "One page, bullet points, big font.",
        "Include: her name, provider, pediatrician, allergies, blood type if known.",
        "Pain management preference: no meds / open to epidural / definitely epidural.",
        "Environment: lights, music, who's in the room.",
        "Post-delivery: delayed cord clamping, immediate skin-to-skin, delayed bath, feeding preference.",
        "Emergency: 'If a C-section is needed, my partner attends and stays with the baby.'",
      ],
      commonMistakes: [
        "Making it rigid. Add 'preferences may change based on medical need.'",
        "Handing it over at 8cm dilated. Give it at check-in.",
      ],
      actionChecklist: [
        "Draft by week 32.",
        "Review with provider at a prenatal appointment.",
        "Bring 3 printed copies to the hospital.",
      ],
      keyTakeaways: [
        "One page. Preferences. Flexible.",
        "It's for the team, not for Instagram.",
      ],
    },
    related: ["hospital-bag", "delivery-basics"],
  }),
  L({
    slug: "what-happens-labor",
    categorySlug: c,
    title: "What Actually Happens During Labor",
    summary: "Timeline of the day from her first contraction to holding the baby.",
    minutes: 6,
    weekRange: [32, 40],
    sections: {
      overview: "A typical first-time labor lasts 12–24 hours. You'll spend most of it at home. When you go in, expect triage, admission, monitoring, and eventually pushing and delivery.",
      whyItMatters: "Knowing the sequence removes 90% of the fear. You'll recognize each phase and know what to do in it.",
      steps: [
        "Home phase: contractions, timing, walking, eating light, resting between.",
        "Triage: they check dilation. Below ~4cm, they may send you home.",
        "Admission: IV, monitors, room setup, birth plan handoff.",
        "Active labor: contractions intensify, epidural window if chosen.",
        "Transition: shortest and hardest — this is when she doubts everything.",
        "Pushing: minutes to a couple hours.",
        "Delivery: baby out, skin-to-skin, cord clamped, placenta delivered.",
        "First hour ('golden hour'): stay, help with first feed, protect the space.",
      ],
      commonMistakes: [
        "Going in too early and getting sent home discouraged.",
        "Filming the delivery instead of being in it.",
        "Leaving the room during the golden hour to text family.",
      ],
      actionChecklist: [
        "Do the hospital dry run route before week 36.",
        "Learn the 5-1-1 rule.",
        "Line up who texts the family so you don't have to.",
      ],
      keyTakeaways: [
        "Most of labor is at home.",
        "Transition is the moment to hold, not fix.",
        "The first hour is sacred — stay in the room.",
      ],
    },
    related: ["labor-basics", "supporting-during-labor"],
  }),
  L({
    slug: "supporting-during-labor",
    categorySlug: c,
    title: "Supporting Her Through Labor",
    summary: "Concrete, low-drama things to do during each stage.",
    minutes: 5,
    weekRange: [32, 40],
    sections: {
      overview: "Your job during labor is presence + logistics. Not coaching, not fixing, not narrating. Be the calmest person in the room.",
      whyItMatters: "The nurses will run the medical show. You run the emotional and logistical show. That's your lane.",
      steps: [
        "Bring water, ice chips, chapstick, cold cloth. Refresh constantly.",
        "Time contractions early, then hand it to the nurse when active.",
        "Physical support: counter-pressure on lower back, hip squeeze, hand to squeeze.",
        "Verbal: short and true. 'You're doing it.' 'One at a time.' 'I'm here.'",
        "Advocate: ask BRAIN questions if interventions are proposed.",
        "Manage family: one point person texts updates. Not you.",
      ],
      commonMistakes: [
        "Talking during contractions. Silence, then support.",
        "Making it about you being tired or hungry.",
        "Coaching her breathing when she's got her own rhythm.",
      ],
      actionChecklist: [
        "Practice counter-pressure and hip squeeze once before week 36.",
        "Assign the family text point person.",
        "Charge everything the night bags leave for the hospital.",
      ],
      keyTakeaways: [
        "Presence + logistics. Not coaching.",
        "Short truthful words during contractions.",
        "Protect the room.",
      ],
    },
    related: ["what-happens-labor", "emotional-support"],
  }),
  L({
    slug: "what-to-expect-hospital",
    categorySlug: c,
    title: "What to Expect at the Hospital",
    summary: "Rooms, staff, monitors, and how the day-to-day actually runs.",
    minutes: 4,
    weekRange: [30, 40],
    sections: {
      overview: "You'll move through triage, labor/delivery, and recovery/postpartum rooms. Expect regular nurse checks, monitors on her belly, and a lot of forms.",
      whyItMatters: "Knowing the environment reduces cognitive load. You can focus on her instead of decoding the room.",
      steps: [
        "Triage: small, curtain-divided rooms. Short stay.",
        "L&D room: bigger, private, where delivery happens.",
        "Postpartum room: usually smaller, where you'll stay 24–48 hrs.",
        "Nurses swap shifts every 12 hours — introduce yourselves each time.",
        "Meals: hers is comped; yours may not be. Bring snacks.",
      ],
      commonMistakes: [
        "Trying to sleep on the floor. Ask for a fold-out chair.",
        "Ignoring the nurse call button when she's uncomfortable.",
      ],
      actionChecklist: [
        "Tour the hospital before week 34 if offered.",
        "Confirm partner meal policy.",
        "Know where the nearest coffee is.",
      ],
      keyTakeaways: [
        "Three rooms, one journey.",
        "Nurses run the ship. Be respectful, be present.",
      ],
    },
    related: ["first-24-hours", "going-home"],
  }),
  L({
    slug: "first-24-hours",
    categorySlug: c,
    title: "The First 24 Hours",
    summary: "What happens the day the baby is here — hour by hour.",
    minutes: 6,
    weekRange: [36, 40],
    sections: {
      overview: "The first 24 hours include skin-to-skin, first feed, first bath (delayed if you choose), newborn checks, and constant nurse visits.",
      whyItMatters: "It goes fast and blurry. Knowing the plan lets you actually be present instead of reacting.",
      steps: [
        "Hour 0–1: golden hour, skin-to-skin, first latch attempt.",
        "Hour 1–3: newborn assessment, weight, measurements, vitamin K, eye ointment.",
        "Hour 3–12: move to postpartum room, more feeds, first diapers.",
        "Hour 12–24: hearing test, pediatrician visit, jaundice screening, feeding rhythm forming.",
        "Whole time: nurse checks every 2–4 hours for both mom and baby.",
      ],
      commonMistakes: [
        "Letting visitors in during the golden hour.",
        "Trying to 'get some sleep' by leaving her alone with a newborn.",
      ],
      actionChecklist: [
        "Decide on delayed bath, vitamin K, eye ointment in advance.",
        "Zero visitors for the first 24 hours unless she says otherwise.",
      ],
      keyTakeaways: [
        "Golden hour is protected.",
        "Newborn procedures are routine but should be your call.",
      ],
    },
    related: ["going-home", "visitors"],
  }),
  L({
    slug: "going-home",
    categorySlug: c,
    title: "Going Home from the Hospital",
    summary: "Discharge, car seat, first drive, first night home — done right.",
    minutes: 5,
    weekRange: [36, 40],
    sections: {
      overview: "Discharge takes hours — expect paperwork, a car-seat check, and last pediatric checks. Drive home slow. First night is emotional.",
      whyItMatters: "This transition is where a lot of couples wobble. Owning it calmly sets the tone for the first two weeks.",
      steps: [
        "Confirm pediatrician follow-up (usually 24–72 hrs after discharge).",
        "Nurse verifies car seat installation.",
        "Bring the going-home outfit and swaddle.",
        "You drive. She sits with baby. Take the slow route.",
        "First night home: skin-to-skin, low lights, quiet. No unpacking, no laundry, no visitors.",
      ],
      commonMistakes: [
        "Speeding home to 'get settled.'",
        "Inviting family over the first night.",
      ],
      actionChecklist: [
        "Pediatrician appointment booked before discharge.",
        "Freezer meal ready for night one.",
      ],
      keyTakeaways: [
        "Slow the drive.",
        "First night is quiet, low, close.",
      ],
    },
    related: ["first-24-hours", "visitors", "freezer-meals"],
  }),
  L({
    slug: "visitors",
    categorySlug: c,
    title: "The Visitors Policy",
    summary: "Who, when, how long — decided before the baby arrives.",
    minutes: 4,
    weekRange: [32, 40],
    sections: {
      overview: "Everyone wants to visit. Not everyone should — at least not right away. A policy set in advance beats a fight in the moment.",
      whyItMatters: "She just gave birth. She needs sleep, quiet, and space to figure out feeding. Uncontrolled visitors sabotage all three.",
      steps: [
        "Draft the policy with her: who is 'week one,' who is 'week two,' who waits longer.",
        "Set visit length (30–60 minutes max) and rules (no sick, no unsolicited advice, no unwashed hands, no kissing the baby).",
        "Communicate to family before delivery. You send the message, not her.",
        "Enforce it. 'We appreciate you coming, we need to feed / rest / nap now.'",
      ],
      commonMistakes: [
        "Not deciding until family is already at the door.",
        "Letting one family override your policy because 'they mean well.'",
      ],
      actionChecklist: [
        "Send the visitor plan text to family by week 36.",
        "Line up polite exit lines you can deliver without escalation.",
      ],
      keyTakeaways: [
        "Decide first. Enforce always.",
        "You're the bouncer. She's the guest of honor.",
      ],
    },
    related: ["going-home", "postpartum-support"],
  }),
  L({
    slug: "important-documents",
    categorySlug: c,
    title: "Important Documents",
    summary: "IDs, insurance, birth certificate, SSN — what you need and when.",
    minutes: 4,
    weekRange: [30, 40],
    sections: {
      overview: "You'll need her ID, both insurance cards, pre-registration paperwork, birth plan, and a plan for the birth certificate and SSN.",
      whyItMatters: "Missing paperwork can delay discharge, insurance coverage, or newborn coverage on your plan.",
      steps: [
        "Pre-register at the hospital by week 32.",
        "Confirm insurance covers the delivery and how to add baby (usually within 30 days of birth).",
        "Hospital typically initiates birth certificate + SSN paperwork in room. Do it before discharge.",
        "Keep digital copies of ID + insurance in both phones.",
      ],
      commonMistakes: [
        "Missing the 30-day window to add baby to insurance.",
        "Losing the birth certificate paperwork in the go-bag chaos.",
      ],
      actionChecklist: [
        "Pre-register done.",
        "'Add baby to insurance' reminder set for day 3.",
        "Birth certificate + SSN forms completed before discharge.",
      ],
      keyTakeaways: [
        "Pre-register early.",
        "30-day insurance clock starts at birth.",
      ],
    },
    related: ["hospital-bag", "insurance-basics"],
  }),
];
