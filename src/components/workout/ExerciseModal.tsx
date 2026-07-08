import { useState, useEffect } from "react";
import { X, Plus, ChevronDown, ChevronUp, ArrowLeftRight, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

// Movement pattern categories for swap suggestions — granular sub-patterns
const MOVEMENT_PATTERNS: Record<string, string[]> = {
  // ── CHEST ──
  "Flat Press": ["Barbell Bench Press", "DB Bench Press", "Machine Chest Press", "Smith Machine Bench Press", "Floor Press", "Close-Grip Bench Press"],
  "Incline Press": ["Incline Barbell Bench", "Incline DB Press", "Low-Incline DB Press", "Incline Smith Press", "Incline Machine Press", "Neutral-Grip Incline DB Press"],
  "Decline / Dip Press": ["Decline Bench Press", "Decline DB Press", "Weighted Dips", "Dips", "Machine Dip"],
  "Chest Fly / Isolation": ["Cable Crossover", "Cable Fly", "DB Fly", "Incline DB Fly", "Pec Deck", "Machine Fly", "Low Cable Fly", "High Cable Fly", "Svend Press"],

  // ── SHOULDER ──
  "Vertical Push / OHP": ["Overhead Press", "DB Shoulder Press", "Seated DB Press", "Arnold Press", "Landmine Press", "Z Press", "Push Press", "Machine Shoulder Press", "Smith OHP", "Viking Press"],
  "Lateral Delt": ["DB Lateral Raise", "Cable Lateral Raise", "Machine Lateral Raise", "Leaning Cable Lateral Raise", "Upright Row", "Lu Raise", "Behind-Back Cable Lateral Raise"],
  "Rear Delt / Upper Back": ["Face Pull", "Reverse Fly", "Reverse Pec Deck", "Band Pull-Apart", "Prone I-Y-T Raise", "Rear Delt Cable Fly", "DB Rear Delt Fly", "Chest-Supported Rear Delt Raise"],

  // ── BACK ──
  "Horizontal Pull / Row": ["Barbell Row", "Pendlay Row", "DB Row", "SA DB Row", "Cable Row", "Seated Cable Row", "Chest-Supported Row", "Machine Row", "T-Bar Row", "Seal Row", "Meadows Row", "Helms Row", "Landmine Row"],
  "Vertical Pull": ["Pull-Up", "Chin-Up", "Lat Pulldown", "Wide-Grip Pulldown", "Neutral-Grip Pulldown", "Close-Grip Pulldown", "Cable Pullover", "Straight-Arm Pulldown", "Machine Pulldown", "Assisted Pull-Up"],

  // ── LEGS: SQUAT PATTERNS ──
  "Quad-Dominant Squat": ["Back Squat", "Front Squat", "Goblet Squat", "Leg Press", "Hack Squat", "Safety Bar Squat", "Belt Squat", "Pendulum Squat", "Smith Squat", "Cyclist Squat"],
  "Single-Leg Squat": ["Bulgarian Split Squat", "Split Squat", "Reverse Lunge", "Walking Lunge", "Step-Up", "Front-Foot-Elevated Split Squat", "DB Split Squat", "Deficit Reverse Lunge"],
  "Glute-Focused Squat": ["Sumo Squat", "Wide-Stance Leg Press", "Sumo Goblet Squat", "Curtsy Lunge", "Sumo Smith Squat", "Cable Squat"],
  "Quad Isolation": ["Leg Extension", "Single-Leg Extension", "Sissy Squat", "Bodyweight Sissy Squat", "Spanish Squat", "Reverse Nordic Curl"],

  // ── LEGS: HINGE / POSTERIOR ──
  "Hinge / Deadlift": ["Deadlift", "Romanian Deadlift", "Trap Bar Deadlift", "Sumo Deadlift", "Stiff-Leg Deadlift", "DB RDL", "Single-Leg RDL", "Block Pull", "Deficit Deadlift", "Good Morning"],
  "Hip Thrust / Glute": ["Barbell Hip Thrust", "DB Hip Thrust", "Smith Hip Thrust", "Glute Bridge", "Single-Leg Hip Thrust", "Cable Pull-Through", "Glute Kickback", "Machine Glute Kickback", "Reverse Hyper", "45° Hip Extension"],
  "Hamstring Isolation": ["Lying Leg Curl", "Seated Leg Curl", "Single-Leg Curl", "Nordic Curl", "GHR", "Slider Leg Curl", "Stability Ball Leg Curl", "Banded Leg Curl", "Standing Leg Curl"],

  // ── ARMS ──
  "Biceps": ["Barbell Curl", "DB Curl", "EZ Bar Curl", "Incline DB Curl", "Hammer Curl", "Cable Curl", "Preacher Curl", "Spider Curl", "Concentration Curl", "Machine Curl", "Bayesian Curl", "Cross-Body Curl"],
  "Triceps": ["Tricep Pushdown", "Rope Pushdown", "Overhead Tricep Extension", "Cable Overhead Extension", "Skull Crusher", "Close-Grip Bench Press", "Dips", "JM Press", "French Press", "Kickback", "Single-Arm Pushdown"],

  // ── CORE ──
  "Core / Anti-Extension": ["Plank", "Ab Wheel Rollout", "Dead Bug", "Body Saw", "Stability Ball Rollout", "Long-Lever Plank", "Hanging Leg Raise", "Cable Crunch", "Decline Crunch"],
  "Core / Anti-Rotation": ["Pallof Press", "Cable Chop", "Cable Lift", "Landmine Rotation", "Bird Dog", "Half-Kneeling Pallof"],
  "Loaded Carry": ["Farmer Carry", "Suitcase Carry", "Overhead Carry", "Trap Bar Carry", "Sandbag Carry", "Waiter Walk"],
};

// Keyword → pattern mapping for fuzzy matching
const EXERCISE_PATTERN_HINTS: [RegExp, string][] = [
  // Chest
  [/incline\s*(db|dumbbell|barbell|smith|machine|neutral)/i, "Incline Press"],
  [/flat\s*(bench|press|db|dumbbell)/i, "Flat Press"],
  [/bench\s*press/i, "Flat Press"],
  [/db\s*bench/i, "Flat Press"],
  [/close.?grip\s*bench/i, "Flat Press"],
  [/floor\s*press/i, "Flat Press"],
  [/machine\s*chest/i, "Flat Press"],
  [/decline/i, "Decline / Dip Press"],
  [/\bdips?\b/i, "Decline / Dip Press"],
  [/(cable|pec)\s*(cross|fly|deck)/i, "Chest Fly / Isolation"],
  [/\bfly\b/i, "Chest Fly / Isolation"],
  [/svend/i, "Chest Fly / Isolation"],

  // Shoulder
  [/overhead\s*press|ohp|\bstrict\s*press|military/i, "Vertical Push / OHP"],
  [/(db|dumbbell|seated)\s*(shoulder|press)|arnold/i, "Vertical Push / OHP"],
  [/landmine\s*press/i, "Vertical Push / OHP"],
  [/z\s*press|push\s*press|viking/i, "Vertical Push / OHP"],
  [/lateral\s*raise|lat\s*raise|lu\s*raise|upright\s*row/i, "Lateral Delt"],
  [/face\s*pull|rear\s*delt|reverse\s*(fly|pec)|band\s*pull/i, "Rear Delt / Upper Back"],
  [/prone\s*[iyt]/i, "Rear Delt / Upper Back"],

  // Back
  [/pull.?up|chin.?up|pulldown|lat\s*pull|cable\s*pullover|straight.?arm/i, "Vertical Pull"],
  [/row|seal\s*row|t.?bar|meadows|helms|landmine\s*row/i, "Horizontal Pull / Row"],

  // Legs
  [/leg\s*extension|sissy\s*squat|spanish\s*squat|reverse\s*nordic/i, "Quad Isolation"],
  [/leg\s*curl|nordic\s*curl|\bghr\b|slider\s*curl|hamstring\s*curl/i, "Hamstring Isolation"],
  [/hip\s*thrust|glute\s*bridge|pull.?through|glute\s*kick|reverse\s*hyper|hip\s*extension/i, "Hip Thrust / Glute"],
  [/sumo\s*(squat|goblet|smith)|curtsy|wide.?stance\s*leg/i, "Glute-Focused Squat"],
  [/bulgarian|split\s*squat|lunge|step.?up/i, "Single-Leg Squat"],
  [/deadlift|rdl|romanian|stiff.?leg|good\s*morning|block\s*pull/i, "Hinge / Deadlift"],
  [/squat|leg\s*press|hack\s*squat|belt\s*squat|pendulum|cyclist/i, "Quad-Dominant Squat"],

  // Arms
  [/curl|bicep|bayesian|preacher|spider|hammer|concentration/i, "Biceps"],
  [/tricep|pushdown|skull\s*crush|french\s*press|jm\s*press|kickback|overhead.*ext/i, "Triceps"],

  // Core
  [/carry|farmer|suitcase|waiter|sandbag/i, "Loaded Carry"],
  [/pallof|chop|lift|anti.?rot|bird\s*dog/i, "Core / Anti-Rotation"],
  [/plank|ab\s*wheel|rollout|dead\s*bug|leg\s*raise|crunch|cable\s*crunch/i, "Core / Anti-Extension"],
];

function findPatternForExercise(name: string): { pattern: string; alternatives: string[] } | null {
  const lower = name.toLowerCase();

  // 1. Try regex hints first for precise matching
  for (const [regex, pattern] of EXERCISE_PATTERN_HINTS) {
    if (regex.test(lower)) {
      const exercises = MOVEMENT_PATTERNS[pattern];
      if (exercises) {
        return { pattern, alternatives: exercises.filter(e => e.toLowerCase() !== lower && !lower.includes(e.toLowerCase())) };
      }
    }
  }

  // 2. Fallback: check if name appears in any pattern list
  for (const [pattern, exercises] of Object.entries(MOVEMENT_PATTERNS)) {
    if (exercises.some(e => lower.includes(e.toLowerCase()) || e.toLowerCase().includes(lower))) {
      return { pattern, alternatives: exercises.filter(e => e.toLowerCase() !== lower && !lower.includes(e.toLowerCase())) };
    }
  }

  return null;
}

interface ExerciseModalProps {
  exercise: { name: string; detail: string; sets: number; reps: number | null; video_url?: string | null; video_type?: string | null; defaultWeight?: number | null };
  programId?: string | null;
  dayNumber?: number;
  onClose: () => void;
  onSwap?: (originalName: string, newName: string, newDetail: string, scope: "workout" | "mesocycle") => void;
  onPrev?: () => void;
  onNext?: () => void;
  exerciseLabel?: string; // e.g. "3 of 8"
}

export function ExerciseModal({ exercise, programId, dayNumber, onClose, onSwap, onPrev, onNext, exerciseLabel }: ExerciseModalProps) {
  const { user } = useAuth();
  const [sets, setSets] = useState<{ weight: string; reps: string }[]>(
    Array.from({ length: exercise.sets }, () => ({ weight: "", reps: exercise.reps ? String(exercise.reps) : "" }))
  );
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<{ workout_date: string; sets: any[]; notes?: string }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [lastWeights, setLastWeights] = useState<string[]>([]);

  // Swap state
  const [showSwap, setShowSwap] = useState(false);
  const [swapScope, setSwapScope] = useState<"workout" | "mesocycle">("workout");
  const [customSwapName, setCustomSwapName] = useState("");
  const [swapConfirmed, setSwapConfirmed] = useState(false);

  const patternInfo = findPatternForExercise(exercise.name);

  // Reset sets when exercise changes (e.g. arrow navigation)
  useEffect(() => {
    setSets(Array.from({ length: exercise.sets }, () => ({ weight: "", reps: exercise.reps ? String(exercise.reps) : "" })));
    setNotes("");
    setLastWeights([]);
    setSaved(false);
    setShowHistory(false);
    setShowSwap(false);
    setSwapConfirmed(false);
    setCustomSwapName("");
  }, [exercise.name, exercise.sets, exercise.reps]);

  useEffect(() => {
    if (user) {
      // Use ilike with % prefix to match both "Lat Pulldown" and "B1. Lat Pulldown"
      const escapedName = exercise.name.replace(/[%_]/g, '\\$&');
      supabase
        .from("workout_logs")
        .select("workout_date, sets, notes, exercise_name")
        .eq("user_id", user.id)
        .ilike("exercise_name", `%${escapedName}`)
        .order("workout_date", { ascending: false })
        .limit(10)
        .then(({ data }) => {
          if (data) {
            setHistory(data as any);
            const mostRecent = data[0];
            if (mostRecent && (mostRecent.sets as any[]).length > 0) {
              setLastWeights((mostRecent.sets as any[]).map((s: any) => s.weight ? String(s.weight) : ""));
            }
            const today = new Date().toISOString().split("T")[0];
            const todaysLog = data.find((log: any) => log.workout_date === today);
            if (todaysLog) {
              if ((todaysLog.sets as any[]).length > 0) {
                const prefilled = (todaysLog.sets as any[]).map((s: any) => ({
                  weight: s.weight ? String(s.weight) : "",
                  reps: s.reps ? String(s.reps) : (exercise.reps ? String(exercise.reps) : "")
                }));
                if (prefilled.length === exercise.sets) setSets(prefilled);
              }
              if ((todaysLog as any).notes) setNotes((todaysLog as any).notes);
            }
          }
        });
    }
  }, [user, exercise.name, exercise.sets]);

  const updateSet = (i: number, field: "weight" | "reps", val: string) => {
    setSets(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: val } : s));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const today = new Date().toISOString().split("T")[0];
    const setsData = sets.map((s, i) => ({ set: i + 1, weight: Number(s.weight) || 0, reps: Number(s.reps) || 0 }));

    // Use ilike to find existing log (handles both prefixed and clean names)
    const escapedName = exercise.name.replace(/[%_]/g, '\\$&');
    const { data: existingRows } = await supabase
      .from("workout_logs")
      .select("id")
      .eq("user_id", user.id)
      .ilike("exercise_name", `%${escapedName}`)
      .eq("workout_date", today)
      .limit(1);

    const existing = existingRows && existingRows.length > 0 ? existingRows[0] : null;

    if (existing) {
      await supabase
        .from("workout_logs")
        .update({ exercise_name: exercise.name, sets: setsData as any, notes: notes || null })
        .eq("id", existing.id);
    } else {
      await supabase.from("workout_logs").insert({
        user_id: user.id,
        exercise_name: exercise.name,
        sets: setsData,
        workout_date: today,
        notes: notes || null,
      } as any);
    }
    setSaved(true);
    setSaving(false);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleSwapSelect = (newName: string) => {
    if (!onSwap) return;
    onSwap(exercise.name, newName, exercise.detail, swapScope);
    setSwapConfirmed(true);
    setTimeout(() => onClose(), 600);
  };

  const handleCustomSwap = () => {
    if (!onSwap || !customSwapName.trim()) return;
    onSwap(exercise.name, customSwapName.trim(), exercise.detail, swapScope);
    setSwapConfirmed(true);
    setTimeout(() => onClose(), 600);
  };

  const videoUrl = exercise.video_url;
  const videoType = exercise.video_type;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div className="w-full max-w-md bg-card border-t border-border rounded-t-3xl overflow-hidden max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-start px-5 pt-5 pb-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Exercise</p>
              {exerciseLabel && (
                <span className="text-[10px] font-semibold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">{exerciseLabel}</span>
              )}
            </div>
            <h2 className="text-xl font-black text-foreground leading-tight">{exercise.name}</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{exercise.detail}</p>
          </div>
          <div className="flex items-center gap-1 mt-1">
            {onPrev && (
              <button onClick={onPrev} className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
            )}
            {onNext && (
              <button onClick={onNext} className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            )}
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground ml-1"><X className="w-5 h-5" /></button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-5 pb-8 space-y-5">
          {/* Demo Video */}
          {videoUrl && (
            <div>
              <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-2">Demo Video</p>
              <div className="rounded-xl overflow-hidden aspect-video bg-secondary">
                {videoType === "youtube" ? (
                  <iframe className="w-full h-full" src={`https://www.youtube.com/embed/${videoUrl}?rel=0`} title="Exercise demo" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />
                ) : (
                  <video className="w-full h-full" src={videoUrl} controls />
                )}
              </div>
            </div>
          )}

          {/* Weight Logger */}
          <div>
            <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-3">Log Sets</p>
            <div className="space-y-2">
              <div className="grid grid-cols-[40px_1fr_1fr] gap-2 px-1">
                <span className="text-[10px] text-muted-foreground font-semibold uppercase text-center">Set</span>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase text-center">Weight (lbs)</span>
                <span className="text-[10px] text-muted-foreground font-semibold uppercase text-center">Reps</span>
              </div>
              {sets.map((set, i) => (
                <div key={i} className="grid grid-cols-[40px_1fr_1fr] gap-2 items-center">
                  <span className="text-sm font-bold text-muted-foreground text-center">{i + 1}</span>
                  <input type="number" inputMode="decimal" placeholder={lastWeights[i] ? `Last: ${lastWeights[i]}` : (exercise.defaultWeight ? String(exercise.defaultWeight) : "0")} value={set.weight} onChange={e => updateSet(i, "weight", e.target.value)}
                    className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
                  <input type="number" inputMode="numeric" placeholder="0" value={set.reps} onChange={e => updateSet(i, "reps", e.target.value)}
                    className="bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
                </div>
              ))}
              <button onClick={() => setSets(prev => [...prev, { weight: "", reps: exercise.reps ? String(exercise.reps) : "" }])}
                className="w-full flex items-center justify-center gap-2 py-2 border border-dashed border-border rounded-lg text-xs text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors mt-1">
                <Plus className="w-3 h-3" /> Add set
              </button>
            </div>
          </div>

          {/* Notes */}
          <div>
            <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-2">Notes</p>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. felt strong, grip slipping, used belt…"
              rows={2}
              className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
            />
          </div>

          <button onClick={handleSave} disabled={saving || !user}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50">
            {saved ? "✓ Saved!" : saving ? "Saving..." : "Save Sets"}
          </button>

          {/* History */}
          <div>
            <button onClick={() => setShowHistory(!showHistory)} className="flex items-center gap-2 w-full text-left">
              <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">History</p>
              {showHistory ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
            </button>
            {showHistory && (
              <div className="mt-3 space-y-3">
                {history.length === 0 ? (
                  <p className="text-xs text-muted-foreground">No previous logs for this exercise.</p>
                ) : (
                  history.map((log, i) => (
                    <div key={i} className="bg-secondary rounded-lg p-3">
                      <p className="text-xs font-semibold text-primary mb-1">{new Date(log.workout_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
                      <div className="space-y-0.5">
                        {(log.sets as any[]).map((s: any, j: number) => (
                          <p key={j} className="text-xs text-muted-foreground">Set {s.set}: {s.weight} lbs × {s.reps} reps</p>
                        ))}
                      </div>
                      {log.notes && <p className="text-xs text-muted-foreground/80 italic mt-1">📝 {log.notes}</p>}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Exercise Swap */}
          {onSwap && (
            <div>
              <button onClick={() => setShowSwap(!showSwap)} className="flex items-center gap-2 w-full text-left">
                <ArrowLeftRight className="w-3.5 h-3.5 text-muted-foreground" />
                <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Swap Exercise</p>
                {showSwap ? <ChevronUp className="w-3 h-3 text-muted-foreground" /> : <ChevronDown className="w-3 h-3 text-muted-foreground" />}
              </button>

              {showSwap && !swapConfirmed && (
                <div className="mt-3 space-y-4">
                  {/* Scope selector */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Apply swap to</p>
                    <div className="flex gap-2">
                      <button onClick={() => setSwapScope("workout")}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${swapScope === "workout" ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border hover:border-primary/40"}`}>
                        This Workout
                      </button>
                      <button onClick={() => setSwapScope("mesocycle")}
                        className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold border transition-colors ${swapScope === "mesocycle" ? "bg-primary text-primary-foreground border-primary" : "bg-secondary text-muted-foreground border-border hover:border-primary/40"}`}>
                        Rest of Mesocycle
                      </button>
                    </div>
                  </div>

                  {/* Movement pattern alternatives */}
                  {patternInfo && (
                    <div>
                      <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">
                        {patternInfo.pattern} Alternatives
                      </p>
                      <div className="space-y-1.5 max-h-40 overflow-y-auto">
                        {patternInfo.alternatives.map(alt => (
                          <button key={alt} onClick={() => handleSwapSelect(alt)}
                            className="w-full text-left px-3 py-2 bg-secondary border border-border rounded-lg text-sm text-foreground hover:border-primary/50 hover:bg-primary/5 transition-colors">
                            {alt}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Custom entry */}
                  <div>
                    <p className="text-[10px] font-semibold text-muted-foreground uppercase mb-2">Or enter custom</p>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={customSwapName}
                        onChange={e => setCustomSwapName(e.target.value)}
                        placeholder="Exercise name…"
                        className="flex-1 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                      <button onClick={handleCustomSwap} disabled={!customSwapName.trim()}
                        className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold disabled:opacity-40 hover:bg-primary/90 transition-colors">
                        Swap
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {swapConfirmed && (
                <div className="mt-3 bg-primary/10 border border-primary/30 rounded-lg p-3 text-center">
                  <p className="text-sm font-bold text-primary">✓ Exercise swapped!</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
