import type { Lesson } from "./types";

const c = "finance";
function L(l: Lesson): Lesson { return l; }

export const financeLessons: Lesson[] = [
  L({
    slug: "budgeting-for-a-baby",
    categorySlug: c,
    title: "Budgeting for a Baby",
    summary: "Real numbers, not scare stats. Build a monthly ranges plan.",
    minutes: 5,
    weekRange: [12, 36],
    sections: {
      overview: "Baby costs are a mix of one-time (gear, hospital, nursery) and recurring (diapers, formula/food, childcare, health, insurance).",
      whyItMatters: "Anxiety comes from unknowns. Building a monthly range dissolves the fog.",
      steps: [
        "List one-time costs: gear, hospital out-of-pocket, nursery, car seat.",
        "List monthly recurring: diapers ($60–$100), wipes ($20–$40), formula if applicable ($150–$300), childcare (biggest single line if working).",
        "Add insurance premium change for family plan.",
        "Total, then compare to your take-home income. Identify gap.",
        "Adjust: cut discretionary lines, increase emergency fund contributions.",
      ],
      commonMistakes: [
        "Forgetting insurance premium jump.",
        "Missing childcare — often the biggest single line item.",
      ],
      actionChecklist: [
        "Baby budget built and shared with her by week 20.",
        "Childcare researched by week 24.",
      ],
      keyTakeaways: [
        "Numbers dissolve anxiety.",
        "Childcare is usually the biggest new line.",
      ],
    },
    related: ["hospital-costs", "insurance-basics", "emergency-fund"],
  }),
  L({
    slug: "hospital-costs",
    categorySlug: c,
    title: "Understanding Hospital Costs",
    summary: "Deductibles, in-network, out-of-pocket max — decoded.",
    minutes: 4,
    weekRange: [16, 36],
    sections: {
      overview: "Hospital delivery costs vary wildly. Your out-of-pocket depends on your deductible, network, plan max, and whether you hit them earlier in the year.",
      whyItMatters: "Knowing the real number lets you plan cash flow instead of getting shocked in month 3 postpartum.",
      steps: [
        "Call insurance: 'What's the estimated out-of-pocket for a vaginal delivery and a C-section on my plan?'",
        "Verify hospital, delivering OB, and anesthesiologists are in-network.",
        "Ask if there's a case manager for maternity.",
        "Set aside deductible + out-of-pocket max in a sub-account.",
      ],
      commonMistakes: [
        "Assuming anesthesiologist is in-network when hospital is.",
        "Not saving toward the deductible.",
      ],
      actionChecklist: [
        "Insurance call done, estimate written down.",
        "Hospital pre-registration completed.",
      ],
      keyTakeaways: [
        "Call. Ask. Save.",
        "In-network hospital ≠ in-network every doctor.",
      ],
    },
    related: ["important-documents", "insurance-basics"],
  }),
  L({
    slug: "insurance-basics",
    categorySlug: c,
    title: "Insurance for a New Family",
    summary: "Add baby fast. Understand what's covered.",
    minutes: 4,
    weekRange: [30, 40],
    sections: {
      overview: "You have 30 days from birth to add baby to your insurance. Miss it and you may wait until open enrollment.",
      whyItMatters: "Uninsured newborn = massive bills. This is a paperwork race, not a decision.",
      steps: [
        "Compare adding baby to your plan vs. hers if both work.",
        "Confirm pediatrician is in-network.",
        "Add baby to insurance within 30 days.",
        "Save digital insurance cards on both phones.",
        "Understand what preventive visits are 100% covered.",
      ],
      commonMistakes: [
        "Missing the 30-day window.",
        "Assuming pediatrician is in-network.",
      ],
      actionChecklist: [
        "'Add baby to insurance' reminder set for day 3.",
        "Pediatrician network status verified.",
      ],
      keyTakeaways: [
        "30-day clock. Don't miss it.",
      ],
    },
    related: ["hospital-costs", "important-documents"],
  }),
  L({
    slug: "emergency-fund",
    categorySlug: c,
    title: "Emergency Fund for a Family",
    summary: "3–6 months of expenses. Non-negotiable.",
    minutes: 3,
    weekRange: [4, 36],
    sections: {
      overview: "Kids introduce chaos: unexpected medical bills, car repairs on the way to daycare, job changes. 3–6 months of expenses in a high-yield savings account is the floor.",
      whyItMatters: "Financial stress bleeds into every part of parenthood. An emergency fund buys you calm.",
      steps: [
        "Calculate 1 month of essential expenses.",
        "Multiply by 3–6.",
        "Open a HYSA if you don't have one.",
        "Auto-transfer weekly. Start small if needed.",
      ],
      commonMistakes: [
        "Keeping the fund in checking (it will get spent).",
        "Waiting until you can save 'a lot' to start.",
      ],
      actionChecklist: [
        "HYSA opened.",
        "Auto-transfer scheduled.",
      ],
      keyTakeaways: [
        "3–6 months. HYSA. Automate.",
      ],
    },
    related: ["budgeting-for-a-baby"],
  }),
  L({
    slug: "life-insurance",
    categorySlug: c,
    title: "Life Insurance 101",
    summary: "Term, not whole. 10× income, 20-year term. Simple.",
    minutes: 4,
    weekRange: [4, 40],
    sections: {
      overview: "Term life insurance is cheap protection for your family in case you die during the years they depend on your income. Skip whole life for most cases.",
      whyItMatters: "This is the least glamorous, highest-love purchase you'll make.",
      steps: [
        "Aim: 10–15× your gross annual income.",
        "Term: 20 or 30 years, matched to how long dependents need income.",
        "Both parents get coverage — stay-at-home work has real replacement cost.",
        "Get quotes from 2–3 term insurers.",
        "Complete medical exam and lock the rate before rates climb with age.",
      ],
      commonMistakes: [
        "Buying whole life when term is what you need.",
        "Only insuring the working parent.",
      ],
      actionChecklist: [
        "Term life quote obtained.",
        "Policy in place before baby's 1st birthday.",
      ],
      keyTakeaways: [
        "Term. 10–15×. Both parents.",
      ],
    },
    related: ["estate-planning-basics"],
  }),
  L({
    slug: "estate-planning-basics",
    categorySlug: c,
    title: "Estate Planning Basics",
    summary: "Will, guardianship, beneficiaries. Uncomfortable, essential.",
    minutes: 5,
    weekRange: [4, 40],
    sections: {
      overview: "If both parents die, who raises your kid, and with what resources? A basic will + guardianship designation + updated beneficiaries answers this.",
      whyItMatters: "Dying without a will means courts decide. Nobody wants that outcome for their kid.",
      steps: [
        "Write a will (online service or attorney).",
        "Name guardians for the baby. Discuss with them first.",
        "Update beneficiaries on retirement, life insurance, bank accounts.",
        "Consider a basic revocable trust if you own real estate.",
        "Store documents where your partner can find them.",
      ],
      commonMistakes: [
        "Delaying because 'we're young.'",
        "Naming guardians without asking them.",
      ],
      actionChecklist: [
        "Will drafted before baby's 3-month birthday.",
        "Guardianship conversations done.",
      ],
      keyTakeaways: [
        "Write it. Name them. Update beneficiaries.",
      ],
    },
    related: ["life-insurance"],
  }),
  L({
    slug: "saving-for-the-future",
    categorySlug: c,
    title: "Saving for Their Future",
    summary: "529s, custodial accounts, and how to start small.",
    minutes: 4,
    weekRange: [4, 40],
    sections: {
      overview: "529 plans grow tax-free for education. Custodial (UTMA/UGMA) accounts give general flexibility but count as the child's asset.",
      whyItMatters: "Small monthly contributions started at birth compound massively over 18 years.",
      steps: [
        "Open a 529 in your state (or a state offering better tax deduction).",
        "Auto-contribute even $50/month.",
        "Ask family to gift 529 contributions instead of extra toys.",
        "Don't sacrifice your own retirement to save for college.",
      ],
      commonMistakes: [
        "Waiting for a big lump sum to start.",
        "Prioritizing college fund over emergency fund and retirement.",
      ],
      actionChecklist: [
        "529 opened before baby's 1st birthday.",
        "Auto-contribution set.",
      ],
      keyTakeaways: [
        "Start small. Start early.",
        "Retirement > college fund in priority order.",
      ],
    },
    related: ["emergency-fund"],
  }),
];
