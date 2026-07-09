import { useState, useEffect } from "react";
import {
  LogOut,
  Trophy,
  ChevronRight,
  Save,
  BookOpen,
  CalendarIcon,
  Check,
  CreditCard,
  ExternalLink,
  Sparkles,
  Settings,
  Wrench,
  Baby,
  Download,
  BarChart2,
  ClipboardList,
} from "lucide-react";
import { format } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { TIERS, type SubscriptionTier } from "@/lib/subscriptionTiers";
import { ManageSubscriptionView } from "@/components/settings/ManageSubscriptionView";
import { FitnessToolsTab } from "@/components/tools/FitnessToolsTab";
import { DUE_DATE_PASS } from "@/lib/subscriptionTiers";
import { useDueDatePass, recordArrival, joinYearOneWaitlist, useOnWaitlist } from "@/hooks/useM2fOs";
import { generateKeepsake } from "@/lib/keepsake";

interface MoreTabProps {
  tier?: SubscriptionTier;
  subscriptionEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  onRefreshSub?: () => Promise<void>;
  currentProgramId?: string | null;
  onProgramChanged?: () => void;
}

const EXERCISE_CATEGORIES = [
  {
    label: "🦵 Lower Body Strength",
    exercises: [
      { name: "Back Squat", unit: "lbs" },
      { name: "Front Squat", unit: "lbs" },
      { name: "Deadlift – Conventional", unit: "lbs" },
      { name: "Sumo Deadlift", unit: "lbs" },
      { name: "Trap Bar Deadlift", unit: "lbs" },
      { name: "Barbell Hip Thrust", unit: "lbs" },
    ],
  },
  {
    label: "💪 Upper Body Strength",
    exercises: [
      { name: "Bench Press", unit: "lbs" },
      { name: "Overhead Press / Strict Press", unit: "lbs" },
      { name: "Incline Bench Press", unit: "lbs" },
    ],
  },
  {
    label: "⚡ Olympic / Power Strength",
    exercises: [
      { name: "Power Clean", unit: "lbs" },
      { name: "Power Snatch", unit: "lbs" },
    ],
  },
  { label: "🔗 Weighted Bodyweight Strength", exercises: [{ name: "Weighted Pull-Up", unit: "lbs" }] },
  {
    label: "🔥 Bodyweight Strength Endurance",
    exercises: [
      { name: "Pull-Ups", unit: "reps" },
      { name: "Dips", unit: "reps" },
      { name: "Push-Ups", unit: "reps" },
    ],
  },
  {
    label: "🧱 Core & Grip",
    exercises: [
      { name: "Farmer Carry", unit: "lbs" },
      { name: "Dead Hang", unit: "sec" },
    ],
  },
  {
    label: "🏃 Athletic Performance",
    exercises: [
      { name: "Vertical Jump", unit: "in" },
      { name: "10-Yard Sprint", unit: "sec" },
    ],
  },
];

const ALL_EXERCISE_NAMES = EXERCISE_CATEGORIES.flatMap((c) => c.exercises.map((e) => e.name));

interface Program {
  id: string;
  name: string;
  description: string | null;
  total_days: number;
}

export function MoreTab({ tier, subscriptionEnd: subEnd, cancelAtPeriodEnd, onRefreshSub, currentProgramId, onProgramChanged }: MoreTabProps = {}) {
  const { user, signOut } = useAuth();
  const [view, setView] = useState<"menu" | "maxes" | "programs" | "manage-sub" | "tools" | "graduation">("menu");
  const { hasPass, passExpires } = useDueDatePass(user?.id);
  const { data: onWaitlist } = useOnWaitlist(user?.id);
  const [babyName, setBabyName] = useState("");
  const [arrivalDate, setArrivalDate] = useState("");
  const [gradSaving, setGradSaving] = useState(false);
  const [gradSaved, setGradSaved] = useState(false);
  const [buyingPass, setBuyingPass] = useState(false);

  const buyDueDatePass = async () => {
    if (!DUE_DATE_PASS.price_id || buyingPass) return;
    setBuyingPass(true);
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { price_id: DUE_DATE_PASS.price_id },
    });
    setBuyingPass(false);
    if (!error && (data as any)?.url) window.location.href = (data as any).url;
    else toast({ title: "Couldn't start checkout", variant: "destructive" });
  };

  const saveArrival = async () => {
    if (!user || !babyName.trim() || !arrivalDate || gradSaving) return;
    setGradSaving(true);
    const ok = await recordArrival(user.id, babyName, arrivalDate);
    setGradSaving(false);
    if (ok) {
      setGradSaved(true);
      toast({ title: "Welcome to Day One, Dad. 🎉" });
    } else {
      toast({ title: "Failed to save", variant: "destructive" });
    }
  };

  const downloadKeepsake = async () => {
    if (!user) return;
    const { data: assessments } = await (supabase as any)
      .from("assessments")
      .select("total_score, taken_at")
      .eq("user_id", user.id)
      .order("taken_at", { ascending: true });
    const first = assessments?.[0]?.total_score ?? null;
    const last = assessments?.length ? assessments[assessments.length - 1].total_score : null;
    const { data: profile } = await (supabase as any)
      .from("profiles")
      .select("due_date, baby_name, baby_arrived_at, display_name, first_name, name")
      .eq("user_id", user.id)
      .maybeSingle();
    generateKeepsake({
      dadName: profile?.display_name || profile?.first_name || profile?.name || user.email?.split("@")[0] || "Dad",
      babyName: profile?.baby_name || babyName || "Baby Girl",
      arrivedAt: profile?.baby_arrived_at || arrivalDate || new Date().toISOString().slice(0, 10),
      dueDate: profile?.due_date ?? null,
      finalScore: last,
      firstScore: first,
    });
  };

  const joinWaitlist = async () => {
    if (!user?.email) return;
    const ok = await joinYearOneWaitlist(user.id, user.email);
    toast({ title: ok ? "You're on the Year One list." : "Failed to join", variant: ok ? undefined : "destructive" });
  };
  const [programView, setProgramView] = useState<"list" | "detail" | "enroll">("list");
  const [maxes, setMaxes] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Programs state
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [startDate, setStartDate] = useState<Date | undefined>(new Date());
  const [enrolling, setEnrolling] = useState(false);
  const [existingAssignment, setExistingAssignment] = useState<{ id: string; current_day: number } | null>(null);

  // Use props if available, otherwise fall back to local check
  const [localSubscribed, setLocalSubscribed] = useState<boolean | null>(null);
  const [localSubEnd, setLocalSubEnd] = useState<string | null>(null);
  const [checkingSub, setCheckingSub] = useState(false);

  const subscribed = tier != null ? true : localSubscribed;
  const subscriptionEnd = subEnd ?? localSubEnd;

  useEffect(() => {
    if (user && tier == null) checkSubscription();
  }, [user, tier]);

  const checkSubscription = async () => {
    setCheckingSub(true);
    try {
      const { data, error } = await supabase.functions.invoke("check-subscription");
      if (!error && data) {
        setLocalSubscribed(data.subscribed);
        setLocalSubEnd(data.subscription_end);
      }
    } catch {}
    setCheckingSub(false);
  };

  const handleSubscribe = async (priceId?: string) => {
    const { data, error } = await supabase.functions.invoke("create-checkout", {
      body: { price_id: priceId || TIERS.base.monthly_price_id },
    });
    if (error || data?.error) {
      toast({ title: data?.error || "Failed to start checkout", variant: "destructive" });
      return;
    }
    if (data?.url) window.open(data.url, "_blank");
  };

  useEffect(() => {
    if (user) {
      supabase
        .from("user_maxes")
        .select("exercise_name, weight_lbs")
        .eq("user_id", user.id)
        .then(({ data }) => {
          if (data) {
            const m: Record<string, string> = {};
            data.forEach((r: any) => {
              m[r.exercise_name] = String(r.weight_lbs);
            });
            setMaxes(m);
          }
        });
    }
  }, [user]);

  useEffect(() => {
    if (user && view === "programs") {
      supabase
        .from("programs")
        .select("id, name, description, total_days")
        .order("name")
        .then(({ data }) => {
          if (data) setPrograms(data as any);
        });
    }
  }, [user, view]);

  // Check for existing inactive assignment when selecting a program
  useEffect(() => {
    if (!user || !selectedProgram) return;
    setExistingAssignment(null);
    supabase
      .from("program_assignments")
      .select("id, current_day")
      .eq("user_id", user.id)
      .eq("program_id", selectedProgram.id)
      .eq("is_active", false)
      .limit(1)
      .then(({ data }) => {
        if (data && data.length > 0) setExistingAssignment(data[0] as any);
      });
  }, [user, selectedProgram]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    for (const name of ALL_EXERCISE_NAMES) {
      const val = maxes[name];
      if (val && Number(val) > 0) {
        await supabase.from("user_maxes").upsert(
          {
            user_id: user.id,
            exercise_name: name,
            weight_lbs: Number(val),
          },
          { onConflict: "user_id,exercise_name" },
        );
      }
    }
    setSaving(false);
  };

  const enrollInProgram = async (program: Program) => {
    if (!user) return;
    setEnrolling(true);

    // Deactivate all current active assignments
    await supabase
      .from("program_assignments")
      .update({ is_active: false })
      .eq("user_id", user.id)
      .eq("is_active", true);

    if (existingAssignment) {
      // Reactivate existing — resume where they left off
      await supabase
        .from("program_assignments")
        .update({ is_active: true })
        .eq("id", existingAssignment.id);
    } else {
      // Create new assignment
      await supabase.from("program_assignments").insert({
        user_id: user.id,
        program_id: program.id,
        current_day: 1,
        assigned_by: user.id,
        assigned_at: startDate ? startDate.toISOString() : new Date().toISOString(),
        is_active: true,
      });
    }

    setSelectedProgram(null);
    setEnrolling(false);
    if (onProgramChanged) onProgramChanged();
  };

  const PHASE_INFO: Record<
    string,
    { phases: { name: string; weeks: string; focus: string }[]; weeklyStructure: string[]; features: string[] }
  > = {
    "M2F Rebuild": {
      phases: [
        { name: "Phase 1 — Foundation", weeks: "Weeks 1–4", focus: "Build movement quality, develop work capacity, moderate hypertrophy volume" },
        { name: "Phase 2 — Strength Build", weeks: "Weeks 5–8", focus: "Increase compound strength, heavier loading, maintain hypertrophy" },
        { name: "Phase 3 — Performance Development", weeks: "Weeks 9–12", focus: "Explosive strength, athletic performance, maintain muscle" },
        { name: "Phase 4 — Peak Hybrid", weeks: "Weeks 13–16", focus: "Highest strength expression, strongest conditioning, maintain physique" },
      ],
      weeklyStructure: [
        "Day 1 — Upper Strength + Power",
        "Day 2 — Lower Strength + Power",
        "Day 3 — Conditioning + Core",
        "Day 4 — Upper Hypertrophy",
        "Day 5 — Lower Hypertrophy",
        "Day 6 — Athletic Conditioning",
        "Day 7 — Rest / Mobility",
      ],
      features: [
        "Moderate intensity with progressive overload",
        "Higher hypertrophy volume with supersets",
        "Simpler explosive movements (med ball, box jumps)",
        "Conditioning circuits for fat loss",
        "Shoulder & hip prehab built in",
        "Exercise rotation between phases for joint longevity",
      ],
    },
    "M2F Perform": {
      phases: [
        { name: "Phase 1 — Foundation", weeks: "Weeks 1–4", focus: "Build movement quality, speed work foundations, power development" },
        { name: "Phase 2 — Strength Build", weeks: "Weeks 5–8", focus: "Heavier loading, Olympic lift complexes, advanced conditioning" },
        { name: "Phase 3 — Performance Development", weeks: "Weeks 9–12", focus: "Peak power, explosive strength, sport-specific conditioning" },
        { name: "Phase 4 — Peak Hybrid", weeks: "Weeks 13–16", focus: "Highest strength expression, elite conditioning, physique maintenance" },
      ],
      weeklyStructure: [
        "Day 1 — Upper Strength + Power",
        "Day 2 — Lower Strength + Power",
        "Day 3 — Conditioning + Core",
        "Day 4 — Upper Hypertrophy",
        "Day 5 — Lower Hypertrophy",
        "Day 6 — Athletic Conditioning",
        "Day 7 — Rest / Mobility",
      ],
      features: [
        "Heavier compound lifts with longer rest",
        "Speed work (speed bench/squat) opens sessions",
        "Olympic lift derivatives and power cleans",
        "Sprint and interval conditioning",
        "Plyometric and power development",
        "Exercise rotation between phases for joint longevity",
      ],
    },
    "12-Week Dad Bod Transformation Challenge": {
      phases: [
        { name: "Phase 1 — Work Capacity", weeks: "Weeks 1–4", focus: "Build movement quality, develop work capacity, moderate hypertrophy volume. Deload at Week 4." },
        { name: "Phase 2 — Strength/Hypertrophy", weeks: "Weeks 5–8", focus: "Increase compound strength, heavier loading, maintain hypertrophy. Deload at Week 8." },
        { name: "Phase 3 — Peak Intensity", weeks: "Weeks 9–12", focus: "Peak strength expression, advanced conditioning, highest training intensity." },
      ],
      weeklyStructure: [
        "Day 1 — Upper Strength + Power (Speed Bench)",
        "Day 2 — Lower Strength + Power (Speed Deadlift)",
        "Day 3 — HIIT + Core",
        "Day 4 — Upper Hypertrophy",
        "Day 5 — Lower Hypertrophy",
        "Day 6 — Core + Arms (Density Blocks)",
        "Day 7 — Rest / Mobility",
      ],
      features: [
        "Speed sets (50-75%) on bench and deadlift",
        "Garage gym optimized — no dual-cable machines",
        "~1:1.15 push-to-pull ratio",
        "Density blocks for arms and loaded carries",
        "Built-in deload weeks at Weeks 4 and 8",
        "RIR-based progression throughout",
      ],
    },
  };

  // ---- GRADUATION VIEW (Slice 6) ----
  if (view === "graduation") {
    return (
      <div className="px-4 pt-4 pb-nav space-y-4">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setView("menu")} className="text-sm text-muted-foreground hover:text-foreground">
            ← Back
          </button>
          <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Day One</p>
          <div className="w-10" />
        </div>

        {!gradSaved ? (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
            <div>
              <h2 className="text-xl font-black text-foreground">She's here?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Lock in the day everything changed. Your countdown becomes a count-up.
              </p>
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase mb-1.5">Her name</p>
              <input
                type="text"
                value={babyName}
                onChange={(e) => setBabyName(e.target.value)}
                placeholder="e.g. Parker"
                maxLength={50}
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase mb-1.5">Arrival date</p>
              <input
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <button
              onClick={saveArrival}
              disabled={!babyName.trim() || !arrivalDate || gradSaving}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {gradSaving ? "Saving..." : "She's Here 🎉"}
            </button>
          </div>
        ) : (
          <div className="bg-card border border-primary/40 rounded-2xl p-5 space-y-4 text-center">
            <h2 className="text-xl font-black text-foreground">Day One, Dad.</h2>
            <p className="text-sm text-muted-foreground">
              The build phase is over. The real work — and the best part — starts now.
            </p>
            <button
              onClick={downloadKeepsake}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" /> Download The Keepsake
            </button>
            {!onWaitlist ? (
              <button
                onClick={joinWaitlist}
                className="w-full py-3 rounded-xl bg-secondary border border-border text-foreground font-bold text-sm hover:border-primary transition-colors"
              >
                Join the Year One waitlist
              </button>
            ) : (
              <p className="text-xs text-primary font-bold">✓ You're on the Year One waitlist</p>
            )}
          </div>
        )}
      </div>
    );
  }

  // ---- TOOLS VIEW ----
  if (view === "tools") {
    return (
      <div className="pb-nav">
        <div className="flex items-center justify-between px-4 pt-4 mb-2">
          <button
            onClick={() => setView("menu")}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back
          </button>
          <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Fitness Tools</p>
          <div className="w-10" />
        </div>
        <FitnessToolsTab />
      </div>
    );
  }

  // ---- MANAGE SUBSCRIPTION VIEW ----
  if (view === "manage-sub" && tier) {
    return (
      <ManageSubscriptionView
        tier={tier}
        subscriptionEnd={subscriptionEnd}
        cancelAtPeriodEnd={cancelAtPeriodEnd}
        onBack={() => setView("menu")}
        onRefreshSub={onRefreshSub}
      />
    );
  }

  // ---- PROGRAMS VIEW ----
  if (view === "programs") {
    // Enroll confirmation
    if (programView === "enroll" && selectedProgram) {
      return (
        <div className="px-4 pt-4 pb-nav space-y-4">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => setProgramView("detail")}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>
            <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
              {existingAssignment ? "Resume Program" : "Start Program"}
            </p>
            <div className="w-10" />
          </div>
          <div className="bg-card border border-border rounded-xl p-5 space-y-4">
            <div>
              <h2 className="text-lg font-black text-foreground">{selectedProgram.name}</h2>
              <p className="text-xs text-primary font-semibold mt-1">{selectedProgram.total_days} day program</p>
            </div>

            {existingAssignment ? (
              <div className="bg-primary/10 border border-primary/30 rounded-xl p-4">
                <p className="text-sm font-bold text-foreground">Welcome back!</p>
                <p className="text-xs text-muted-foreground mt-1">
                  You'll pick up where you left off on Day {existingAssignment.current_day}.
                </p>
              </div>
            ) : (
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase mb-2">Start Date</p>
                <Popover>
                  <PopoverTrigger asChild>
                    <button
                      className={cn(
                        "w-full flex items-center gap-2 bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm text-left",
                        !startDate && "text-muted-foreground",
                      )}
                    >
                      <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                      {startDate ? format(startDate, "PPP") : "Pick a date"}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            )}

            <button
              onClick={() => enrollInProgram(selectedProgram)}
              disabled={enrolling}
              className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {enrolling
                ? "Switching..."
                : existingAssignment
                ? `Resume Day ${existingAssignment.current_day} 🔄`
                : "Start This Program 🚀"}
            </button>
          </div>
        </div>
      );
    }

    // Program detail page
    if (programView === "detail" && selectedProgram) {
      const info = PHASE_INFO[selectedProgram.name];
      return (
        <div className="px-4 pt-4 pb-nav space-y-5">
          <div className="flex items-center justify-between mb-2">
            <button
              onClick={() => {
                setProgramView("list");
                setSelectedProgram(null);
              }}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              ← Back
            </button>
            <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Program Details</p>
            <div className="w-10" />
          </div>

          {/* Hero */}
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="text-2xl font-black text-foreground tracking-tight">{selectedProgram.name}</h2>
            {selectedProgram.description && (
              <p className="text-sm text-muted-foreground leading-relaxed">{selectedProgram.description}</p>
            )}
            <div className="flex items-center gap-4 pt-1">
              <span className="text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
                {selectedProgram.total_days} days
              </span>
              <span className="text-xs font-bold text-muted-foreground bg-secondary px-3 py-1 rounded-full">
                {Math.round(selectedProgram.total_days / 7)} weeks
              </span>
            </div>
          </div>

          {/* Weekly Structure */}
          {info && (
            <div className="space-y-3">
              <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase px-1">Weekly Structure</p>
              <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                {info.weeklyStructure.map((day, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${day.includes("Rest") ? "bg-muted-foreground" : "bg-primary"}`}
                    />
                    <span
                      className={`text-sm ${day.includes("Rest") ? "text-muted-foreground" : "text-foreground"} font-medium`}
                    >
                      {day}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Phases */}
          {info && (
            <div className="space-y-3">
              <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase px-1">Program Phases</p>
              <div className="space-y-2">
                {info.phases.map((phase, i) => (
                  <div key={i} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-sm text-foreground">{phase.name}</p>
                      <span className="text-[10px] text-primary font-semibold bg-primary/10 px-2 py-0.5 rounded-full">
                        {phase.weeks}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{phase.focus}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          {info && (
            <div className="space-y-3">
              <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase px-1">Program Features</p>
              <div className="bg-card border border-border rounded-xl p-4 space-y-2">
                {info.features.map((f, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-primary flex-shrink-0" />
                    <span className="text-sm text-foreground">{f}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* No phase info fallback */}
          {!info && selectedProgram.description && (
            <div className="bg-card border border-border rounded-xl p-4">
              <p className="text-sm text-muted-foreground">{selectedProgram.description}</p>
            </div>
          )}

          {/* CTA */}
          <div className="pt-2 space-y-2">
            {currentProgramId === selectedProgram.id ? (
              <div className="w-full py-3 rounded-xl bg-primary/10 text-primary font-bold text-sm text-center flex items-center justify-center gap-2">
                <Check className="w-4 h-4" /> Currently Active
              </div>
            ) : (
              <button
                onClick={() => setProgramView("enroll")}
                className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
              >
                Start This Program
              </button>
            )}
          </div>
        </div>
      );
    }

    // Program list
    return (
      <div className="px-4 pt-4 pb-nav space-y-4">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setView("menu")} className="text-sm text-muted-foreground hover:text-foreground">
            ← Back
          </button>
          <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Programs</p>
          <div className="w-10" />
        </div>
        <p className="text-xs text-muted-foreground">
          Choose a program to follow. Your current workout plan will be replaced.
        </p>

        {programs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">No programs available yet.</p>
        ) : (
          <div className="space-y-2">
            {programs.map((p) => {
              const isActive = currentProgramId === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProgram(p);
                    setProgramView("detail");
                  }}
                  className={`w-full flex items-center gap-3 bg-card border rounded-xl p-4 transition-all text-left ${isActive ? "border-primary" : "border-border hover:border-primary/40"}`}
                >
                  <BookOpen className={`w-5 h-5 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm text-foreground">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {p.total_days} days · {Math.round(p.total_days / 7)} weeks
                    </p>
                  </div>
                  {isActive ? (
                    <span className="flex items-center gap-1 text-xs text-primary font-semibold">
                      <Check className="w-3 h-3" /> Active
                    </span>
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ---- MAXES VIEW ----
  if (view === "maxes") {
    return (
      <div className="px-4 pt-4 pb-nav space-y-4">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setView("menu")} className="text-sm text-muted-foreground hover:text-foreground">
            ← Back
          </button>
          <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">1RM Maxes</p>
          <div className="w-10" />
        </div>
        <p className="text-xs text-muted-foreground">
          Enter your one-rep max for each exercise. These are used to calculate working weights for percentage-based
          programming.
        </p>
        <div className="space-y-5">
          {EXERCISE_CATEGORIES.map((cat) => (
            <div key={cat.label}>
              <p className="text-xs font-bold text-muted-foreground uppercase mb-2 px-1">{cat.label}</p>
              <div className="space-y-2">
                {cat.exercises.map(({ name, unit }) => (
                  <div key={name} className="flex items-center gap-3 bg-card border border-border rounded-xl p-3">
                    <div className="flex-1">
                      <p className="font-bold text-sm text-foreground">{name}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        inputMode="decimal"
                        placeholder="—"
                        value={maxes[name] || ""}
                        onChange={(e) => setMaxes((prev) => ({ ...prev, [name]: e.target.value }))}
                        className="w-20 bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                      />
                      <span className="text-xs text-muted-foreground w-8">{unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          <Save className="w-4 h-4" /> {saving ? "Saving..." : "Save Maxes"}
        </button>
      </div>
    );
  }

  // ---- MENU ----
  return (
    <div className="px-4 pt-4 pb-nav space-y-2">
      <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-3 px-1">Settings</p>

      {/* Subscription Status */}
      <div className="bg-card border border-border rounded-xl p-4 mb-2">
        <div className="flex items-center gap-3 mb-3">
          <CreditCard className="w-5 h-5 text-primary" />
          <span className="font-bold text-sm text-foreground flex-1">Subscription</span>
          {subscribed === null || checkingSub ? (
            <span className="text-[10px] text-muted-foreground">Checking…</span>
          ) : subscribed ? (
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
              {tier === "performance" ? "Performance" : tier === "base" ? "Base" : "Active"}
            </span>
          ) : (
            <span className="text-[10px] font-bold text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
              Inactive
            </span>
          )}
        </div>
        {subscribed && subscriptionEnd && (
          <p className="text-xs text-muted-foreground mb-3">
            Renews{" "}
            {new Date(subscriptionEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </p>
        )}
        {subscribed ? (
          <div className="space-y-2">
            {tier === "base" && (
              <button
                onClick={() => handleSubscribe(TIERS.performance.monthly_price_id)}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" /> Upgrade to Total Transformation — $
                {TIERS.performance.monthly_price}/mo
              </button>
            )}
            <button
              onClick={() => setView("manage-sub")}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-secondary text-foreground font-semibold text-xs hover:bg-secondary/80 border border-border transition-colors"
            >
              <Settings className="w-3.5 h-3.5" /> Manage Subscription
            </button>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-xs text-center text-primary font-semibold">7-day free trial on all plans</p>
            <button
              onClick={() => handleSubscribe(TIERS.base.monthly_price_id)}
              className="w-full flex flex-col items-center gap-0.5 py-2.5 rounded-lg bg-secondary text-foreground font-semibold text-xs hover:bg-secondary/80 border border-border transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" /> Training Only — ${TIERS.base.monthly_price}/mo
              </span>
              <span className="text-[10px] text-muted-foreground font-normal">Start with 7-day free trial</span>
            </button>
            <button
              onClick={() => handleSubscribe(TIERS.performance.monthly_price_id)}
              className="w-full flex flex-col items-center gap-0.5 py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" /> Total Transformation — ${TIERS.performance.monthly_price}/mo
              </span>
              <span className="text-[10px] font-normal opacity-80">Start with 7-day free trial</span>
            </button>
          </div>
        )}
      </div>

      <button
        onClick={() => setView("maxes")}
        className="w-full flex items-center gap-3 bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-all text-left"
      >
        <Trophy className="w-5 h-5 text-primary" />
        <span className="flex-1 font-bold text-sm text-foreground">1RM Maxes</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>
      <button
        onClick={() => setView("programs")}
        className="w-full flex items-center gap-3 bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-all text-left"
      >
        <BookOpen className="w-5 h-5 text-primary" />
        <span className="flex-1 font-bold text-sm text-foreground">Programs</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>
      {/* Due-Date Pass (Slice 4) */}
      {!subscribed && !hasPass && DUE_DATE_PASS.price_id && (
        <button
          onClick={buyDueDatePass}
          disabled={buyingPass}
          className="w-full text-left bg-card border border-primary/40 rounded-xl p-4 hover:border-primary transition-all"
        >
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary mb-1">One-time · ${DUE_DATE_PASS.price}</p>
          <p className="font-bold text-sm text-foreground">{DUE_DATE_PASS.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{DUE_DATE_PASS.description}</p>
        </button>
      )}
      {hasPass && (
        <div className="bg-card border border-primary/40 rounded-xl p-4">
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-primary mb-1">Due-Date Pass Active</p>
          <p className="text-xs text-muted-foreground">
            Full access through {passExpires ? new Date(passExpires + "T00:00:00").toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }) : "your due date window"}.
          </p>
        </div>
      )}

      <button
        onClick={() => setView("tools")}
        className="w-full flex items-center gap-3 bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-all text-left"
      >
        <Wrench className="w-5 h-5 text-primary" />
        <span className="flex-1 font-bold text-sm text-foreground">Fitness Tools</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>
      <button
        onClick={() => setView("graduation")}
        className="w-full flex items-center gap-3 bg-card border border-border rounded-xl p-4 hover:border-primary/40 transition-all text-left"
      >
        <Baby className="w-5 h-5 text-primary" />
        <span className="flex-1 font-bold text-sm text-foreground">She's Here</span>
        <ChevronRight className="w-4 h-4 text-muted-foreground" />
      </button>
      <button
        onClick={signOut}
        className="w-full flex items-center gap-3 bg-card border border-border rounded-xl p-4 hover:border-destructive/40 transition-all text-left"
      >
        <LogOut className="w-5 h-5 text-destructive" />
        <span className="flex-1 font-bold text-sm text-destructive">Log Out</span>
      </button>
    </div>
  );
}
