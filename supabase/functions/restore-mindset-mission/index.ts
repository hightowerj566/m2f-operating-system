import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PROGRAM_ID = "e2f3c441-becf-4d4e-9a8b-0323ae52550c";

// Unique mindset moments for weeks 5-24 (one per training day, ~120 needed)
const MINDSET_MOMENTS: string[] = [
  "The weight doesn't care about your excuses. Neither does your son watching you quit. Show up and earn the right to lead.",
  "You're not training for a trophy. You're training so your daughter knows what consistency looks like in a man.",
  "Fatigue is a conversation, not a command. Acknowledge it, then do the work anyway.",
  "The man who shows up tired and still executes is more dangerous than the man who only shows up when he feels good.",
  "Your kids don't need a perfect dad. They need a present one. This hour is how you practice presence.",
  "Strength isn't built in comfort. Neither is character. Today you build both.",
  "Every rep is a vote for the man you're becoming. Cast wisely.",
  "The bar doesn't lie. Your effort is the only currency that matters here.",
  "Discipline feels heavy until it becomes your identity. Then it feels like freedom.",
  "You chose this. Not because it's easy, but because easy never built anything worth having.",
  "Your family doesn't need you to be the strongest man in the gym. They need you to be the most reliable man in the house.",
  "The gap between who you are and who you want to be closes one training session at a time.",
  "Pain is information. Listen to it, learn from it, but don't let it make your decisions.",
  "You're not just moving weight. You're moving the needle on every relationship that matters.",
  "The hardest part isn't the workout. It's showing up when nobody's watching and nobody cares.",
  "Your body keeps score. So does your family. Make both counts positive today.",
  "Mediocrity is comfortable. That's exactly why most men never leave it.",
  "The version of you that your kids brag about to their friends — that man is built in sessions like this.",
  "Rest when you need to. Quit never. There's a difference, and today you learn it.",
  "You don't rise to the level of your goals. You fall to the level of your systems. This is your system.",
  "Somewhere a man with less talent and more discipline is outworking you. Not today.",
  "The weight room is the one place where effort is always rewarded. Take that lesson home.",
  "Your kids are watching how you handle hard things. This is a hard thing. Handle it well.",
  "Intensity without consistency is just a highlight reel. Build the full season.",
  "The man who controls his body controls his life. Start here.",
  "You're not competing with anyone in this gym. You're competing with yesterday's version of yourself.",
  "Comfort is the enemy of growth. You didn't come here to be comfortable.",
  "Every father who trains is writing a permission slip for his kids to take care of themselves.",
  "The calluses on your hands tell a story. Make it one worth telling.",
  "When your son asks you to play, will your body say yes? That's why you're here.",
  "Focus isn't a talent. It's a practice. Practice it now, use it at home.",
  "The man who does the hard things first has easier days. Start with this.",
  "Your legacy isn't what you say. It's what you repeatedly do. Do this.",
  "There's no participation trophy for fatherhood. You earn it daily. Starting now.",
  "The strongest position isn't under the bar. It's kneeling next to your kid at bedtime after a full day. Train for that.",
  "You're building armor today. Not against the world — against your own weakness.",
  "Motivation got you here. Discipline keeps you here. Choose discipline.",
  "A strong back carries more than weight. It carries responsibility. Strengthen both.",
  "The gym is practice for life. Controlled stress, measured response, progressive growth.",
  "Your wife doesn't need a hero. She needs a partner who handles his own stuff. This is handling your stuff.",
  "Every set you finish is proof that you can do hard things. Carry that proof home.",
  "The difference between a dad and a father is intentionality. Be intentional with every rep.",
  "You're not here to punish your body. You're here to prepare it for everything life demands.",
  "The man who trains consistently teaches his family that promises are kept.",
  "Ego says go heavier. Wisdom says go better. Listen to wisdom today.",
  "You have 168 hours this week. You're investing 5 of them here. Make them count.",
  "The best fathers I know are the ones who take care of themselves without apology.",
  "Your energy at dinner tonight starts with your effort right now. Invest wisely.",
  "Strength isn't just physical. But physical strength makes everything else easier.",
  "The world tells you to hustle harder. This program tells you to train smarter. Trust the process.",
  "When you're tempted to skip, remember: your kids can't skip needing you.",
  "The bar humbles everyone equally. Accept the lesson and grow from it.",
  "Today's discomfort is tomorrow's capacity. Build capacity.",
  "A man who masters himself has nothing left to prove. Train for mastery.",
  "Your children will forget what you said. They'll never forget what you did. Do this.",
  "The pursuit of strength is really the pursuit of self-respect. Earn it.",
  "Recovery isn't weakness. It's strategy. Recover like a professional.",
  "You're not avoiding laziness. You're building momentum. Keep it rolling.",
  "The hardest conversation you'll have today isn't at work. It's with yourself, right now, about showing up fully.",
  "Every father who prioritizes his health gives his family the gift of longevity.",
  "This session isn't about today. It's about who you are 10 years from now.",
  "The weight room is one of the few places where the rules are simple and the rewards are real.",
  "You're not grinding. You're growing. There's a difference. Feel it.",
  "The man your kids need doesn't exist yet. He's being built, one session at a time.",
  "Control the controllable. Your effort, your attitude, your consistency.",
  "A body in motion stays in motion. A dad in motion inspires motion in his kids.",
  "You've survived 100% of your worst days. This workout isn't your worst day. Attack it.",
  "The investment you make in yourself today pays dividends to everyone who depends on you.",
  "Be the dad who's ready. Ready to play, ready to protect, ready to lead.",
  "Champions aren't made in the arena. They're made in the preparation. This is your preparation.",
  "Your body is the vehicle for your purpose. Maintain it like your life depends on it — because it does.",
  "No one will remember your excuses. They'll remember your example.",
  "Train like someone is watching. Because someone is — and they're shorter than you think.",
  "The father who invests in himself isn't selfish. He's strategic.",
  "Peak performance isn't about one great day. It's about a hundred good ones in a row.",
  "Your potential doesn't care about your circumstances. Show up anyway.",
  "The bar doesn't negotiate. Meet it where it is, then move it where you want it.",
  "Phase by phase, rep by rep — this is how ordinary men build extraordinary lives.",
  "You signed up for fatherhood. You signed up for this program. Honor both commitments.",
  "The expression phase is about showing what you've built. Express yourself fully today.",
];

// Unique dad missions for weeks 5-24
const DAD_MISSIONS: string[] = [
  "Ask your child what made them laugh today. Listen without checking your phone.",
  "Do 10 push-ups with your kid on your back. Let them count.",
  "Write a one-sentence note and put it in your child's lunch box or backpack.",
  "Take a 10-minute walk with your partner after dinner. No phones.",
  "Ask your child to teach you something they learned this week.",
  "Hold a 60-second plank while your kid tries to make you laugh.",
  "Tell your partner one specific thing they did this week that you noticed and appreciated.",
  "Sit on the floor with your kids for 10 minutes. Play whatever they want.",
  "Call your own dad (or a father figure) and ask how he's doing. Just listen.",
  "Let your child pick dinner tonight. No complaints, no substitutions.",
  "Do a farmer's carry with grocery bags while your kid races you to the door.",
  "Read a bedtime story with different voices for each character.",
  "Ask your partner: 'What's one thing I could do better this week?' Don't defend — just listen.",
  "Challenge your kid to a race across the yard. Let them win the first one. Not the second.",
  "Take 5 minutes before bed to write down three things your family did well today.",
  "Teach your child one exercise from today's workout. Make it fun.",
  "Put your phone in a drawer from dinner until bedtime. Be fully present.",
  "Tell your child a story about a time you failed and what you learned from it.",
  "Ask your partner what their stress level is from 1-10. If it's above 5, ask how you can help.",
  "Do a bear crawl race with your kids. Accept the carpet burns.",
  "Make breakfast for your family tomorrow morning. Even if it's just cereal, serve it.",
  "Ask your child: 'What's something you wish we did more together?'",
  "Send your partner a text right now with something specific you love about them.",
  "Spend 10 minutes doing a puzzle, building blocks, or coloring with your kid. No screens.",
  "Look your child in the eyes when they talk to you today. Every time.",
  "Do 5 minutes of stretching with your family before bed. Make it a routine.",
  "Ask your kid what superpower they'd want. Share yours. Discuss why.",
  "Give your partner 30 uninterrupted minutes to do whatever they want tonight. Take over.",
  "Take your kid outside for 10 minutes. No agenda. Just be outside together.",
  "Tell your child one thing you're proud of them for that has nothing to do with achievement.",
  "Cook one meal this week that your family eats together at the table. No TV.",
  "Ask your child what they're worried about. Don't fix it — just hear them.",
  "Do a piggyback ride around the house. Bonus: do lunges while carrying them.",
  "Write down one goal for your family this month. Share it with your partner.",
  "Let your child lead the family on a 10-minute adventure walk around the neighborhood.",
  "Ask your partner: 'When did you last feel really happy?' Listen to the answer.",
  "Challenge your kid to see who can hold a wall sit longer. Cheer them on.",
  "Put a hand-written 'I'm proud of you' note somewhere your child will find it.",
  "Have a 5-minute dance party with your kids. Let them pick the music.",
  "Ask your child to rate their day 1-10 at dinner. Ask what would make it a 10.",
  "Give your partner a genuine compliment in front of your kids.",
  "Do 10 squats every time you pick up a toy today. Make it a game.",
  "Teach your child how to shake hands properly. Practice with them.",
  "Ask your child what they think you do at work. Their answer will surprise you.",
  "Spend 5 minutes before bed reviewing your day. What did you give your family today?",
  "Take a family photo today. Not for social media — for your family.",
  "Ask your partner what their favorite memory of your family is. Share yours.",
  "Let your child 'coach' you through 5 exercises. Follow their instructions exactly.",
  "Have a tech-free hour with your family this weekend. Board game, walk, or just talk.",
  "Tell your child about a time you were scared but did something brave anyway.",
  "Make eye contact with your partner and say 'thank you for being my partner' today.",
  "Race your kid to clean up a room. Make chores competitive and fun.",
  "Ask your child what makes a good dad. Listen carefully to their answer.",
  "Carry your child on your shoulders for a walk around the block.",
  "Before bed, tell your child three things about them that make you smile.",
  "Plan a surprise 10-minute activity for your child this weekend. Nothing fancy, just intentional.",
  "Do mobility work on the floor while your kids climb on you. Multitask fatherhood.",
  "Ask your partner: 'What's something on your mind that you haven't told me?'",
  "High-five your kid for something small today. Celebrate the little wins.",
  "Teach your child one core value you believe in. Explain why it matters to you.",
  "Spend the first 5 minutes when you get home fully present. No phone, no distractions. Just connect.",
  "Ask your kid what they want to be when they grow up. Ask follow-up questions.",
  "Do something physical with your family this weekend. Hike, bike, play catch — move together.",
  "Write down one thing you want your kids to say about you when they're grown. Work toward it today.",
  "Hold your partner's hand for no reason today. Physical connection matters.",
  "Ask your child what makes them feel safe. Make sure you're part of that answer.",
  "End the day by telling yourself: 'I showed up today. For myself and for them.' Mean it.",
  "Let your kid pick a workout exercise. Do it together for 1 minute.",
  "Take 2 minutes to breathe with your child. In for 4, out for 6. Teach them calm.",
  "Share a meal without any screens at the table. Ask each person about their high and low.",
  "Build something with your kid. Legos, fort, sandcastle — creation is connection.",
  "Tell your partner one way they've made you a better man. Be specific.",
  "Arm wrestle your kid. Let them feel your strength, then let them feel their own.",
  "Take a progress photo. Not for vanity — for proof that discipline compounds.",
  "Ask your child: 'Do you know I love you? How do you know?' Make sure they can answer.",
  "Plan 15 minutes of undivided attention for each child this week. Put it on the calendar.",
  "Before your head hits the pillow: did you lead your family well today? Adjust tomorrow.",
  "Do 20 bodyweight squats while brushing your teeth. Show your kids that fitness is everywhere.",
  "Text your partner something unexpected mid-day. Not logistics. Something real.",
  "Ask your child to help you with one adult task today. Let them feel trusted and capable.",
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Fetch weeks 5-24 (days 29-168)
    const { data: days, error } = await supabase
      .from("program_days")
      .select("id, day_number, exercises")
      .eq("program_id", PROGRAM_ID)
      .gte("day_number", 29)
      .lte("day_number", 168)
      .order("day_number");

    if (error) throw new Error("Fetch failed: " + error.message);

    const results: string[] = [];
    let mindsetIdx = 0;
    let missionIdx = 0;

    for (const day of days!) {
      const exercises = day.exercises as any[];
      const dow = ((day.day_number - 1) % 7) + 1;
      
      // Check if already has mindset/mission
      const hasMindset = exercises.some((e: any) => e.type === "mindset");
      const hasMission = exercises.some((e: any) => e.type === "mission");

      // Rest days (dow 7) get mindset+mission but no exercises
      // Training days (dow 1,2,4,5) get mindset+mission  
      // Conditioning days (dow 3,6) typically don't get them but we'll add to all non-rest
      
      if (hasMindset && hasMission) {
        results.push(`D${day.day_number}: already has both`);
        continue;
      }

      const newExercises = [...exercises];

      if (!hasMindset && mindsetIdx < MINDSET_MOMENTS.length) {
        newExercises.push({
          type: "mindset",
          name: "Mindset Moment",
          detail: MINDSET_MOMENTS[mindsetIdx],
        });
        mindsetIdx++;
      }

      if (!hasMission && missionIdx < DAD_MISSIONS.length) {
        newExercises.push({
          type: "mission",
          name: "Dad Mission",
          detail: DAD_MISSIONS[missionIdx],
        });
        missionIdx++;
      }

      const { error: updErr } = await supabase
        .from("program_days")
        .update({ exercises: newExercises })
        .eq("id", day.id);

      if (updErr) throw new Error(`Update D${day.day_number} failed: ${updErr.message}`);
      results.push(`D${day.day_number} (dow${dow}): +mindset +mission`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        mindset_used: mindsetIdx,
        mission_used: missionIdx,
        details: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[RESTORE-MINDSET-MISSION] ERROR:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
