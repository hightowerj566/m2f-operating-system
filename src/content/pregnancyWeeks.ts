// M2F OS · Her & Baby, week by week. 36 cards (weeks 5–40).
// Three lines each: baby, her, his move. Grounded in standard pregnancy
// milestones — general guidance, not medical advice.

export interface PregnancyWeekCard {
  week: number;
  baby: string;   // what's happening with the baby
  her: string;    // what she's likely experiencing
  move: string;   // his move this week
}

export const PREGNANCY_WEEKS: PregnancyWeekCard[] = [
  { week: 5,  baby: "Size of an apple seed. Heart is forming and will start beating this week.", her: "She just found out or just told you. Hormones are surging; exhaustion hits like a wall.", move: "Say out loud that you're in. Then prove it — take over one recurring chore permanently, starting tonight." },
  { week: 6,  baby: "Heartbeat is detectable. Neural tube closing; face features starting.", her: "Nausea often starts now. Smells she loved last week can turn her stomach.", move: "Learn her new food triggers without complaint. Keep crackers and water on her nightstand." },
  { week: 7,  baby: "Doubled in size. Arm and leg buds forming.", her: "Fatigue is heavy. She may be sleeping 10 hours and still wrecked.", move: "Guard her sleep. Take the early mornings and the late kitchen cleanup." },
  { week: 8,  baby: "Size of a raspberry. Fingers and toes are forming. Moving already — she can't feel it yet.", her: "First prenatal appointment usually lands around now. She's nervous even if she doesn't say it.", move: "Be at that appointment. Calendar blocked, phone away, questions ready." },
  { week: 9,  baby: "All essential organs have started forming. Officially looks human.", her: "Morning sickness may be peaking. Emotions swing hard and fast.", move: "Don't fix, don't logic. 'That sounds miserable, what can I take off your plate' beats any solution." },
  { week: 10, baby: "Size of a strawberry. Vital organs are in place and starting to function.", her: "Still in the hard stretch. She may be hiding how rough she feels at work.", move: "Text her midday. Not 'how are you' — 'thinking about you and the little one.' Specific beats generic." },
  { week: 11, baby: "Almost fully formed. Head is nearly half the body.", her: "Nausea may be starting to lift. Her body is changing before anyone can tell.", move: "Start the money work now: call insurance, get the delivery number. Do it before she asks." },
  { week: 12, baby: "Reflexes developing — fingers open and close. End of the first trimester is here.", her: "Miscarriage risk drops sharply; many couples announce around now. Relief mixed with 'this is real.'", move: "Ask her how SHE wants to announce — or if she wants to wait. Her call, your backup." },
  { week: 13, baby: "Vocal cords forming. About the size of a lemon.", her: "Energy starting to return. Welcome to the honeymoon trimester.", move: "Book a trip or a serious date within the next month. This window is the best she'll feel." },
  { week: 14, baby: "Second trimester begins. Facial expressions — squinting, frowning — are happening.", her: "Appetite returns. The bump starts becoming real.", move: "Start the registry research together. One evening, laptops out, snacks provided by you." },
  { week: 15, baby: "Can sense light through closed eyelids. Skeleton hardening.", her: "She may feel 'in between' — regular clothes tight, maternity too big.", move: "Zero comments on how anything fits. If she wants new clothes, that's a yes, today." },
  { week: 16, baby: "Size of an avocado. Growth spurt weeks ahead.", her: "Some women feel first flutters between now and week 20.", move: "Anatomy scan is coming (18–20). Get it on your calendar in ink — this is the big one." },
  { week: 17, baby: "Practicing sucking and swallowing. Fat stores starting.", her: "Her center of gravity is shifting; back twinges begin.", move: "Take over everything heavy and everything low — laundry baskets, dog food bags, bottom-shelf anything." },
  { week: 18, baby: "Ears in final position — can start to hear you.", her: "Possibly feeling movement. Sleep positions getting complicated.", move: "Buy the pregnancy pillow. Don't ask — just have it on the bed by Friday." },
  { week: 19, baby: "Developing a protective coating; senses wiring up fast.", her: "Round ligament pain — sharp side twinges — can scare her. It's normal, and still worth mentioning to the doctor.", move: "Learn what's normal vs. call-the-doctor. Be the calm database, not another worrier." },
  { week: 20, baby: "Halfway. Size of a banana. Anatomy scan usually happens now — you may confirm she's a girl.", her: "The bump is public. Strangers comment. Some of it lands wrong.", move: "This scan is a memory. Take the printout, frame one, send it to nobody until she says so." },
  { week: 21, baby: "Kicks are real now — strong enough for her to feel daily.", her: "She's tracking movement. Quiet days worry her.", move: "Put your hand on the bump every night. First time you feel a kick, that's your before-and-after moment." },
  { week: 22, baby: "Looks like a miniature newborn. Grip is developing.", her: "Feeling more herself, but swelling may start in feet and hands.", move: "Nursery decision week: room, colors, crib. You drive the logistics, she drives the taste." },
  { week: 23, baby: "Hearing your voice regularly — and learning it.", her: "Third-trimester preview: backaches, occasional heartburn.", move: "Talk to the bump. Feels ridiculous for ten seconds, then it doesn't. She's learning your voice." },
  { week: 24, baby: "Viability milestone — a big quiet threshold. Lungs developing branches.", her: "Glucose screening usually scheduled soon. She may be anxious about it.", move: "Know her appointment schedule cold. 'When's the glucose test?' should never be your question." },
  { week: 25, baby: "Responding to sound with movement. Growing hair.", her: "Sleep is degrading. Naps aren't luxury, they're maintenance.", move: "Build her a nap window every weekend day. You take the phone, the dogs, the door." },
  { week: 26, baby: "Eyes forming fully; will open soon. Practicing breathing motions.", her: "The third trimester is next week. Mental load is spiking — lists on lists.", move: "Take half her list. Literally — sit down, split it, own your half visibly." },
  { week: 27, baby: "Last week of the second trimester. Brain activity ramping up.", her: "Braxton Hicks practice contractions may start. First ones can rattle her.", move: "Learn the difference between practice and real contractions tonight. Ten minutes now, calm later." },
  { week: 28, baby: "Third trimester. Eyes open. Sleep-wake cycles forming.", her: "Appointments go to every two weeks. Fatigue is returning.", move: "Start your hospital-route homework: route, parking, check-in desk. Do the dry run this month." },
  { week: 29, baby: "About 2.5 lbs. Kicks are strong enough to see through her shirt.", her: "Her back hurts most evenings. She won't always say it.", move: "Rub her back tonight without being asked. Repeat every night this week. That's the mission." },
  { week: 30, baby: "Brain developing fast; regulating its own temperature better.", her: "Ten weeks out. Nesting urgency is real now — she feels every unfinished thing.", move: "Finish one whole nursery task to done — not 80%. Photograph it. Show her." },
  { week: 31, baby: "All five senses working. Head-down turn is coming.", her: "Sleep is hard, bathroom trips constant, patience thin.", move: "CPR class booked or completed by end of this week. Non-negotiable." },
  { week: 32, baby: "Practicing breathing, sucking, swallowing — rehearsing for outside.", her: "Officially uncomfortable. Bending over is a negotiation.", move: "Car seat: buy it, install it, get it checked. This is the week." },
  { week: 33, baby: "Bones hardening (skull stays flexible for delivery). Gaining half a pound a week.", her: "She's thinking about labor daily. Fears surface at night.", move: "Ask: 'What are you most afraid of about delivery?' Then just listen. No fixing." },
  { week: 34, baby: "Central nervous system maturing. Almost ready.", her: "Pediatrician should be picked; hospital pre-registration usually opens.", move: "Pack the hospital bag — hers, yours, baby's. Stage it by the door where you trip over it." },
  { week: 35, baby: "Most systems are ready; lungs finishing last.", her: "Weekly appointments begin soon. Everything is heavy — literally.", move: "Freezer meal weekend: cook and stock 10+ meals. Future-3am-you says thank you." },
  { week: 36, baby: "Considered 'early term' at the end of this week. Dropping lower into position.", her: "'Lightning' pains and pressure. She's done being pregnant.", move: "Lock the visitor policy with her — who, when, how long. Before the family group chat decides for you." },
  { week: 37, baby: "Practicing gripping and turning toward light. Ready is close.", her: "Any-day-now mode begins. Every twinge gets evaluated.", move: "Phone charged, truck gassed, plans cancelable. You are on call. Act like it." },
  { week: 38, baby: "Fully developed — now just adding fat and waiting.", her: "Sleep is survival-mode. She's watching for signs constantly.", move: "Take one last date — even if it's takeout and a drive. Mark the end of this chapter on purpose." },
  { week: 39, baby: "Full term. Brain still growing fast — it will double in year one.", her: "The waiting is the hardest mental stretch of the whole pregnancy.", move: "Keep her distracted and moving: walks, movies, small plans. Steady, not hyped." },
  { week: 40, baby: "Due date week. She arrives on her schedule, not yours.", her: "Every call and text asks 'anything yet?' It's grating on her.", move: "Run interference on the family. Your only jobs: stay calm, stay close, stay ready." },
];

export function weekCard(week: number | null): PregnancyWeekCard | null {
  if (week == null) return null;
  const clamped = Math.min(40, Math.max(5, week));
  return PREGNANCY_WEEKS.find((c) => c.week === clamped) ?? null;
}
