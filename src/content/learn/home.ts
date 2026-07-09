import type { Lesson } from "./types";

const c = "home";
function L(l: Lesson): Lesson { return l; }

export const homeLessons: Lesson[] = [
  L({
    slug: "nursery-setup",
    categorySlug: c,
    title: "Nursery Setup Essentials",
    summary: "The 8 things you actually need. Skip the rest.",
    minutes: 4,
    weekRange: [20, 34],
    sections: {
      overview: "Newborns don't need a Pinterest room. They need a safe sleep space, a changing station, storage, and a feeding chair.",
      whyItMatters: "Simple, functional nurseries are easier to clean, cheaper to build, and safer.",
      steps: [
        "Crib meeting current safety standards.",
        "Firm, flat mattress with a fitted sheet only.",
        "Changing pad on a low, sturdy dresser.",
        "Diaper caddy (diapers, wipes, cream, extra outfit).",
        "Comfortable chair for feeding (glider or armchair).",
        "Blackout curtains.",
        "Sound machine.",
        "Nightlight with warm dim glow.",
      ],
      safetyTips: [
        "No secondhand cribs older than 10 years.",
        "Furniture anchored to the wall.",
      ],
      commonMistakes: [
        "Buying every gadget. Simple wins.",
        "Bassinet in nursery instead of your room.",
      ],
      actionChecklist: [
        "8 essentials in the room by week 34.",
        "Furniture anchored.",
      ],
      keyTakeaways: [
        "Simple, safe, functional.",
        "Anchor furniture. Firm flat crib.",
      ],
    },
    related: ["safe-sleep-environment", "essential-baby-gear"],
  }),
  L({
    slug: "safe-sleep-environment",
    categorySlug: c,
    title: "Building a Safe Sleep Environment",
    summary: "The room, the crib, the temperature — engineered for safe sleep.",
    minutes: 4,
    weekRange: [20, 34],
    sections: {
      overview: "Beyond the crib itself, the whole room affects sleep safety.",
      whyItMatters: "Environment is the easiest place to remove risk. Do it once, benefit forever.",
      steps: [
        "Room temp 68–72°F.",
        "Nothing in the crib but baby + fitted sheet + optional sleep sack.",
        "No cords near the crib. No hanging blinds cords.",
        "Baby monitor: camera high, cord out of reach.",
        "Room-share (not bed-share) for at least 6 months.",
      ],
      safetyTips: [
        "No positioners, wedges, bumpers, weighted anything.",
        "Cordless blinds where you can afford them.",
      ],
      commonMistakes: [
        "'Cute' crib add-ons that increase risk.",
        "Bassinet in another room from day one.",
      ],
      actionChecklist: [
        "Crib checked: empty except baby.",
        "Monitor cords secured out of reach.",
      ],
      keyTakeaways: [
        "Bare crib. Cool room. Same room as you.",
      ],
    },
    related: ["safe-sleep", "nursery-setup"],
  }),
  L({
    slug: "baby-proofing",
    categorySlug: c,
    title: "Baby-Proofing Basics",
    summary: "Room by room walkthrough. Do it before baby moves.",
    minutes: 5,
    weekRange: [30, 40],
    sections: {
      overview: "Baby-proofing isn't urgent day 1 — but it's a lot easier to do before crawling starts (~7 months). Do it early, live with it.",
      whyItMatters: "Emergencies happen in seconds. Prevention is a one-time job.",
      steps: [
        "Outlet covers everywhere.",
        "Furniture and TVs anchored to wall studs.",
        "Cabinet locks on anything with chemicals, medicine, or heavy items.",
        "Baby gates at stairs (top and bottom).",
        "Cords and blinds tied up out of reach.",
        "Water heater set to 120°F max.",
        "Fireplace and hearth padded or gated.",
      ],
      safetyTips: [
        "Post Poison Control number on the fridge.",
        "Never leave water in the tub or buckets.",
      ],
      commonMistakes: [
        "Waiting until baby is mobile.",
        "Skipping cabinet locks 'because they can't reach yet.'",
      ],
      actionChecklist: [
        "Whole-house walkthrough completed by week 36.",
        "Poison Control (1-800-222-1222) saved.",
      ],
      keyTakeaways: [
        "Do it early. Do it once.",
      ],
    },
    related: ["nursery-setup"],
  }),
  L({
    slug: "organizing-supplies",
    categorySlug: c,
    title: "Organizing Baby Supplies",
    summary: "Stations, caddies, and reachable shelves.",
    minutes: 3,
    weekRange: [30, 38],
    sections: {
      overview: "3am you doesn't want to hunt. Set up mini-stations everywhere you'll need them.",
      whyItMatters: "Every 30 seconds of hunting is 30 seconds of avoidable crying.",
      steps: [
        "Diaper caddy in nursery AND living room.",
        "Burp cloths in every couch, kitchen, and nursery drawer.",
        "Feeding station: water bottle, snacks, phone charger, remote.",
        "Emergency outfit + diaper in the diaper bag, restocked weekly.",
      ],
      commonMistakes: [
        "One station only.",
        "Forgetting the feeding station on your side of the couch.",
      ],
      actionChecklist: [
        "Three caddies stocked.",
        "Feeding station done.",
      ],
      keyTakeaways: [
        "Stations everywhere.",
        "Save 3am you.",
      ],
    },
    related: ["nursery-setup"],
  }),
  L({
    slug: "freezer-meals",
    categorySlug: c,
    title: "Freezer Meal Weekend",
    summary: "Two adults cooking one Saturday = two weeks of dinner.",
    minutes: 4,
    weekRange: [32, 38],
    sections: {
      overview: "Batch-cook 10+ meals before delivery. Freeze in single-family portions. Reheat with one hand while holding baby.",
      whyItMatters: "Newborn life is one-handed. Cooking is not. Preparing food is the highest-ROI Saturday you'll spend.",
      steps: [
        "Pick 5 recipes that freeze well: soups, chilis, casseroles, meatballs, breakfast burritos.",
        "Double or triple each. Aim for 10–15 meals.",
        "Freeze in flat freezer bags labeled with name + date + reheat instructions.",
        "Stock breakfast bars, oatmeal packets, easy snacks.",
      ],
      commonMistakes: [
        "One giant lasagna instead of 6 single-serving portions.",
        "No labels — you'll guess in 3 weeks.",
      ],
      actionChecklist: [
        "Freezer meal weekend booked by week 34.",
        "Grocery list finalized in advance.",
      ],
      keyTakeaways: [
        "Batch cook. Portion. Label.",
        "Save future-3am-you.",
      ],
    },
    related: ["postpartum-support"],
  }),
  L({
    slug: "cleaning",
    categorySlug: c,
    title: "Keeping the House Livable",
    summary: "Not spotless — livable. Systems, not sprints.",
    minutes: 3,
    weekRange: [36, 40],
    sections: {
      overview: "Perfect houses fail. Livable ones win. Build small daily routines that keep chaos at bay.",
      whyItMatters: "A cluttered house makes newborn life feel worse than it is. A slightly tidy one gives you an edge.",
      steps: [
        "10-minute nightly reset: dishes, kitchen counter, one load of laundry started.",
        "One 'weekly deep' task rotated (bathroom, floors, sheets).",
        "Consider a cleaner every other week for the first 3 months if budget allows.",
      ],
      commonMistakes: [
        "Trying to deep-clean weekly on top of everything.",
        "Skipping the nightly reset.",
      ],
      actionChecklist: [
        "Nightly reset agreed on with her.",
      ],
      keyTakeaways: [
        "Livable, not spotless.",
        "Nightly reset wins.",
      ],
    },
    related: ["mental-load"],
  }),
  L({
    slug: "essential-baby-gear",
    categorySlug: c,
    title: "Essential Baby Gear (and What to Skip)",
    summary: "The real list. Ignore the marketing.",
    minutes: 5,
    weekRange: [20, 34],
    sections: {
      overview: "You need less than the registry sites say. Focus on sleep, feeding, transport, hygiene, and safety.",
      whyItMatters: "Money and space are finite. Every $200 gadget you skip is money you can spend on childcare, meals, or a weekend away.",
      steps: [
        "Sleep: crib, mattress, 3 fitted sheets, 3 sleep sacks.",
        "Feeding: bottles (start small), burp cloths, bibs, pump if applicable, drying rack.",
        "Transport: car seat (installed and checked), stroller, carrier.",
        "Hygiene: diapers, wipes, cream, baby wash, hooded towels, nail file.",
        "Health: thermometer, nasal aspirator, saline drops, infant Tylenol (per pediatrician).",
      ],
      commonMistakes: [
        "Buying big-ticket gadgets before baby arrives.",
        "Ignoring safety-recall lists on secondhand gear.",
      ],
      actionChecklist: [
        "Registry finalized by week 30.",
        "Car seat installed + inspected.",
      ],
      keyTakeaways: [
        "Less is more. Buy for the first 3 months.",
      ],
    },
    related: ["car-seat-basics", "nursery-setup"],
  }),
  L({
    slug: "car-seat-basics",
    categorySlug: c,
    title: "Car Seat Basics",
    summary: "Rear-facing, tight harness, correct angle. Get it inspected.",
    minutes: 4,
    weekRange: [28, 38],
    sections: {
      overview: "Car seat is a safety-critical install. Rear-facing until at least 2 years (longer if the seat allows).",
      whyItMatters: "It's the one thing between your baby and traffic. Do it right.",
      steps: [
        "Read the seat manual AND the car manual for anchor points.",
        "Install rear-facing, base leveled correctly (check the seat's indicator).",
        "Seat should not move more than 1 inch side-to-side at the belt path.",
        "Harness straps at or below baby's shoulders (rear-facing).",
        "Chest clip at armpit level. Straps snug — no fabric pinch at collarbone.",
        "No puffy coats. Blankets go on top of harness, not under.",
      ],
      safetyTips: [
        "Get installation checked by a certified CPST (free at many fire departments).",
        "Never place car seat on a soft surface (couch, bed).",
      ],
      commonMistakes: [
        "Loose harness.",
        "Puffy coats compress and defeat the harness.",
      ],
      actionChecklist: [
        "Installation done and inspected by week 34.",
        "Manual stored in the car with the seat.",
      ],
      keyTakeaways: [
        "Rear-facing. Snug. Inspected.",
        "No puffy coats. Ever.",
      ],
    },
    related: ["hospital-bag", "going-home"],
  }),
];
