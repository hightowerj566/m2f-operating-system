// M2F OS · The conversation library + Day One playbook + First 40 Days.

// ─────────────────────────────────────────────
// Ask Her Tonight — 52 prompts. Deterministic rotation by day-of-year so the
// prompt is stable all day and different tomorrow. {partner} is replaced with
// her name when known.
// ─────────────────────────────────────────────
export const ASK_HER: string[] = [
  "What's one thing I did this week that actually helped — and one thing I thought helped but didn't?",
  "What are you most afraid of about the delivery? I just want to listen.",
  "When you picture the first night home, what does it look like? What am I doing in it?",
  "What did your parents get right that you want us to keep?",
  "What do you want us to do differently than how you grew up?",
  "What's something about being pregnant that nobody warned you about?",
  "Which visitors do you actually want in the first two weeks — and who can wait?",
  "What's your biggest fear about how WE change after she's born?",
  "If you could hand me one job completely — never think about it again — what would it be?",
  "What does 'supported' look like to you at 3am with a crying baby?",
  "What are you most excited to see me do as a dad?",
  "What's one thing you miss about pre-pregnancy life? Let's do the closest legal version this week.",
  "How do you want to handle your mom and my mom in the delivery window?",
  "What's a name-story you love — how did you get yours?",
  "What's one worry you've been carrying alone this week?",
  "When I'm stressed I get quiet — what do you need me to do instead once she's here?",
  "What should our Sunday look like when she's six months old? Paint it for me.",
  "What's one tradition you want us to start her very first year?",
  "How are you actually feeling about your body right now — and what should I never say?",
  "What kind of dad did you imagine for your kids when you were younger?",
  "What's the one thing you're afraid I'll stop doing after she's born?",
  "If labor starts at 2am, walk me through your ideal version of me.",
  "What song do you want playing when we drive her home?",
  "What part of pregnancy has felt the loneliest?",
  "What do you want your first hour with her to look like? What's my job in it?",
  "Which friend of ours do you think will be the best 'aunt/uncle' — and why?",
  "What's a small daily thing I did when we were dating that you want back?",
  "How should we decide who gets up at night — shifts, instinct, or something else?",
  "What does date night look like in the first three months? Let's book the first one now.",
  "What's one thing about MY family's way of doing things that worries you?",
  "What would make the hospital stay feel safe and calm for you?",
  "What do you want to be called — Mom, Mama, Mommy? Have you thought about it?",
  "What's one purchase you secretly want for her that feels too indulgent? It's yours.",
  "What's your biggest fear about going back to work — or not going back?",
  "When you're overwhelmed, what's the signal I should watch for?",
  "What did today feel like in your body? Give me the real version.",
  "What's one thing you want ME to promise her, out loud, before she's born?",
  "How do you want to handle photos of her online? Let's set the policy now.",
  "What's a meal from your childhood you want her to grow up on?",
  "What are you proudest of about how we've handled this pregnancy so far?",
  "What scares you about me becoming 'Dad' instead of just your husband?",
  "If we get conflicting advice from doctors and family, how do you want us to decide?",
  "What's one thing you need me to defend you from in the first month — people, plans, pressure?",
  "What's the first trip you want to take as a family of three?",
  "What do you think she'll get from you? What do you hope she gets from me?",
  "What's one way I can love you this week that has nothing to do with the baby?",
  "How full is your tank right now, one to ten? What moves it up one point?",
  "What's a hard conversation we keep postponing? Ten minutes, right now, I'll go first.",
  "What did you dream about her last? Literally — any dreams?",
  "What's one thing about labor logistics you assume I know but never actually told me?",
  "What do you want the last photo of 'just us two' to be? Let's take it this week.",
  "Twenty years from now, what's the one sentence you hope she says about her dad?",
];

export function askHerTonight(date: Date = new Date(), partnerName?: string | null): string {
  const start = new Date(date.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((date.getTime() - start.getTime()) / 86400000);
  const prompt = ASK_HER[dayOfYear % ASK_HER.length];
  return partnerName ? prompt.replace(/\bher\b/g, (m) => m) : prompt; // name used in header, prompt stays universal
}

// ─────────────────────────────────────────────
// The Day One Playbook — what to do the moment it starts.
// ─────────────────────────────────────────────
export interface PlaybookStep {
  title: string;
  detail: string;
}

export const DAY_ONE_PLAYBOOK: PlaybookStep[] = [
  { title: "Confirm it's real", detail: "Time the contractions: 5-1-1 (5 min apart, 1 min long, for 1 hour) is the classic go signal. Water breaks = call the OB line regardless. When in doubt, call — that's what the line is for." },
  { title: "Call the OB / hospital line", detail: "They'll tell you when to come in. Put the number in your favorites TODAY, labeled clearly." },
  { title: "Stay level", detail: "Your voice sets the temperature of the room. Slow speech, slow movements. She will remember how you were, not what you said." },
  { title: "Grab the bag, load the car", detail: "Bag from its staging spot, phone chargers, her pillow, car seat already installed. Nothing gets 'found' — everything was staged weeks ago." },
  { title: "Handle the house", detail: "Dogs covered (your pre-arranged person gets one text), doors locked, thermostat sane." },
  { title: "Drive like a professional", detail: "You practiced this route. Calm speed, no heroics — arriving rattled helps nobody." },
  { title: "Check-in is your job", detail: "ID, insurance card, pre-registration name. She answers medical questions; you handle every clipboard." },
  { title: "In the room: advocate, don't perform", detail: "Your three jobs: keep her comfortable (ice chips, position changes, counter-pressure), relay her birth-plan preferences calmly, and be the filter for information and visitors." },
  { title: "The family text protocol", detail: "One update text to one designated relay person. Your hands stay free; your attention stays in the room." },
  { title: "When she arrives", detail: "Skin-to-skin, first photos on YOUR phone only, nothing posted until your wife says so. Then just be there — this is the moment the whole build was for." },
];

// ─────────────────────────────────────────────
// The First 40 Days — Father Mode checklist content.
// ─────────────────────────────────────────────
export const FIRST_40_DAYS: PlaybookStep[] = [
  { title: "Own the nights in shifts", detail: "Agree on shifts before exhaustion decides for you. Even if she's nursing, you can own diaper-burp-resettle so she goes straight back down." },
  { title: "Guard her recovery", detail: "She's healing from a major physical event. Visitors get windows, not open doors. You are the bouncer — kindly, but a bouncer." },
  { title: "Feed the house", detail: "Run the freezer meals, manage the groceries, put water and snacks wherever she feeds the baby. Her only jobs: recover and feed." },
  { title: "Watch her, not just the baby", detail: "Know the signs of postpartum depression and anxiety — in her AND in you. Persistent hopelessness, rage, intrusive thoughts, or numbness past two weeks means calling the OB. Making that call FOR her is love, not overstepping." },
  { title: "Learn your daughter", detail: "Take full solo blocks — bath, diaper, contact naps on your chest. Competence is built in reps, and she needs to see the baby is safe with you." },
  { title: "Move daily, train when you can", detail: "A 20-minute walk with the stroller counts. No streaks, no guilt — movement is for your head right now." },
  { title: "Protect the marriage minute", detail: "Ten minutes a day, phones down, not about logistics. You're not roommates running a facility — keep proving it." },
  { title: "Handle the admin", detail: "Birth certificate, SSN, adding her to insurance (usually a 30-day window), pediatrician day-3 to day-5 visit. All yours." },
  { title: "Take the photos", detail: "Not for posting — for her. Document your wife with the baby; she's in the frame of almost nobody's newborn photos. Fix that." },
  { title: "Re-test at day 40", detail: "Take the Readiness re-test as a Father Mode baseline. The score reset the day she arrived — now build the next version." },
];
