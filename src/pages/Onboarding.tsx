import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { calculateTDEE, type Sex, type Goal, type JobType } from "@/lib/tdeeCalculator";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "@/hooks/use-toast";
import { Navigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Dumbbell, User, Target, Activity, ClipboardCheck, Check } from "lucide-react";
import { CATEGORIES } from "@/lib/readiness";
import bfUnder15 from "@/assets/bf-under15.png";
import bf1522 from "@/assets/bf-15-22.png";
import bf2230 from "@/assets/bf-22-30.png";
import bfOver30 from "@/assets/bf-over30.png";

const STEPS = [
  { label: "Profile", icon: User },
  { label: "Fitness", icon: Activity },
  { label: "Goals", icon: Target },
  { label: "Strength", icon: Dumbbell },
  { label: "Prep", icon: ClipboardCheck },
];

interface OnboardMilestone {
  id: string;
  category_id: number;
  phase: number;
  title: string;
  detail: string | null;
}

const BF_OPTIONS = [
  { value: "under_15", label: "Under 15%", pct: 12, img: bfUnder15 },
  { value: "15_22", label: "15–22%", pct: 18, img: bf1522 },
  { value: "22_30", label: "22–30%", pct: 26, img: bf2230 },
  { value: "over_30", label: "30%+", pct: 35, img: bfOver30 },
];

const GOAL_MAP: Record<string, Goal> = {
  lose_fat: "cut",
  build_muscle: "bulk",
  rebuild: "maintain",
  conditioning: "maintain",
};

export default function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // Step 1
  const [firstName, setFirstName] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState<string>("");

  // Step 2
  const [bodyFat, setBodyFat] = useState<string>("");
  const [experience, setExperience] = useState<string>("");

  // Step 3
  const [goal, setGoal] = useState<string>("");
  const [equipment, setEquipment] = useState<string>("");

  // Step 4
  const [bench, setBench] = useState("");
  const [squat, setSquat] = useState("");
  const [deadlift, setDeadlift] = useState("");

  // Step 5 — Prep list (already-completed milestones)
  const [milestones, setMilestones] = useState<OnboardMilestone[]>([]);
  const [preCompleted, setPreCompleted] = useState<Set<string>>(new Set());
  const [milestonesLoading, setMilestonesLoading] = useState(false);

  useEffect(() => {
    if (step !== 4 || milestones.length > 0) return;
    setMilestonesLoading(true);
    (async () => {
      const { data } = await supabase
        .from("build_milestones")
        .select("id, category_id, phase, title, detail")
        .eq("is_active", true)
        .order("phase")
        .order("sort_order");
      setMilestones((data as OnboardMilestone[]) ?? []);
      setMilestonesLoading(false);
    })();
  }, [step, milestones.length]);

  const togglePreCompleted = (id: string) => {
    setPreCompleted((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const progress = ((step + 1) / STEPS.length) * 100;

  const canAdvance = () => {
    switch (step) {
      case 0:
        return firstName.trim() && heightFt && heightIn && weight && age;
      case 1:
        return bodyFat && experience;
      case 2:
        return goal && equipment;
      case 3:
        return true; // all optional
      case 4:
        return true; // Prep step — all checks optional
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else handleComplete();
  };

  const handleBack = () => {
    if (step > 0) setStep(step - 1);
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const heightInches = parseInt(heightFt) * 12 + parseInt(heightIn);
      const weightLbs = parseFloat(weight);
      const userAge = parseInt(age);
      const bfOption = BF_OPTIONS.find((o) => o.value === bodyFat);
      const bfPct = bfOption?.pct ?? null;

      // Save profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          height_inches: heightInches,
          weight_lbs: weightLbs,
          age: userAge,
          sex: sex || null,
          body_fat_pct: bfPct,
          body_composition_category: bodyFat,
          training_experience: experience,
          goal: goal,
          equipment_access: equipment,
          onboarding_complete: true,
        })
        .eq("user_id", user.id);

      if (profileError) throw profileError;

      // Save strength maxes
      const maxes: { exercise_name: string; weight_lbs: number }[] = [];
      if (bench) maxes.push({ exercise_name: "Bench Press", weight_lbs: parseFloat(bench) });
      if (squat) maxes.push({ exercise_name: "Squat", weight_lbs: parseFloat(squat) });
      if (deadlift) maxes.push({ exercise_name: "Deadlift", weight_lbs: parseFloat(deadlift) });

      if (maxes.length > 0) {
        const inserts = maxes.map((m) => ({ ...m, user_id: user.id }));
        const { error: maxError } = await supabase.from("user_maxes").upsert(inserts, {
          onConflict: "user_id,exercise_name",
        });
        if (maxError) throw maxError;
      }

      // Calculate and save macro targets
      const tdeeGoal = GOAL_MAP[goal] || "maintain";
      const result = calculateTDEE({
        weight_lbs: weightLbs,
        height_inches: heightInches,
        age: userAge,
        sex: (sex as Sex) || "male",
        avg_daily_steps: 7000, // default
        training_days_per_week: 4, // default
        job_type: "desk" as JobType, // default
        body_fat_pct: bfPct,
        goal: tdeeGoal,
      });

      const { error: macroError } = await supabase.from("macro_targets").upsert(
        {
          user_id: user.id,
          calories: result.target_calories,
          protein_g: result.protein_g,
          carbs_g: result.carbs_g,
          fat_g: result.fat_g,
        },
        { onConflict: "user_id" }
      );

      if (macroError) throw macroError;

      // Save pre-completed build milestones (from Prep step)
      if (preCompleted.size > 0) {
        const rows = Array.from(preCompleted).map((milestone_id) => ({
          user_id: user.id,
          milestone_id,
        }));
        const { error: msError } = await supabase
          .from("user_milestones")
          .upsert(rows, { onConflict: "user_id,milestone_id" });
        if (msError) console.error("Milestone save error:", msError);
      }

      toast({ title: "Welcome aboard!", description: "Your profile and macros are set up." });
      navigate("/", { replace: true });
    } catch (err: any) {
      console.error("Onboarding error:", err);
      toast({ title: "Error", description: err.message || "Failed to save onboarding data.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col pt-safe pb-safe">
      {/* Header */}
      <div className="px-4 pt-6 pb-2">
        <h1 className="text-xl font-bold text-foreground text-center">Let's Get You Set Up</h1>
        <p className="text-sm text-muted-foreground text-center mt-1">
          Step {step + 1} of {STEPS.length} — {STEPS[step].label}
        </p>
        <Progress value={progress} className="mt-4 h-2" />

        {/* Step indicators */}
        <div className="flex justify-between mt-3">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={s.label}
                className={`flex flex-col items-center gap-1 text-xs transition-colors ${
                  i <= step ? "text-primary" : "text-muted-foreground"
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-colors ${
                    i < step
                      ? "bg-primary border-primary text-primary-foreground"
                      : i === step
                      ? "border-primary text-primary"
                      : "border-muted text-muted-foreground"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <span className="hidden sm:block">{s.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 px-4 py-6 max-w-md mx-auto w-full">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <Label className="text-foreground">Height</Label>
              <div className="flex gap-2 mt-1">
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Feet"
                    value={heightFt}
                    onChange={(e) => setHeightFt(e.target.value)}
                    min={3}
                    max={8}
                    className="bg-card border-border text-foreground"
                  />
                </div>
                <div className="flex-1">
                  <Input
                    type="number"
                    placeholder="Inches"
                    value={heightIn}
                    onChange={(e) => setHeightIn(e.target.value)}
                    min={0}
                    max={11}
                    className="bg-card border-border text-foreground"
                  />
                </div>
              </div>
            </div>

            <div>
              <Label className="text-foreground">Weight (lbs)</Label>
              <Input
                type="number"
                placeholder="185"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                className="mt-1 bg-card border-border text-foreground"
              />
            </div>

            <div>
              <Label className="text-foreground">Age</Label>
              <Input
                type="number"
                placeholder="35"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="mt-1 bg-card border-border text-foreground"
              />
            </div>

            <div>
              <Label className="text-foreground">Gender (optional)</Label>
              <Select value={sex} onValueChange={setSex}>
                <SelectTrigger className="mt-1 bg-card border-border text-foreground">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-6">
            <div>
              <Label className="text-foreground text-base font-semibold">Estimated Body Fat</Label>
              <div className="grid grid-cols-2 gap-3 mt-3">
                {BF_OPTIONS.map((opt) => (
                  <Card
                    key={opt.value}
                    className={`cursor-pointer transition-all ${
                      bodyFat === opt.value
                        ? "ring-2 ring-primary border-primary"
                        : "border-border hover:border-muted-foreground"
                    }`}
                    onClick={() => setBodyFat(opt.value)}
                  >
                    <CardContent className="p-3 flex flex-col items-center gap-2">
                      <img src={opt.img} alt={opt.label} className="w-16 h-16 object-contain rounded" />
                      <span className="text-sm font-medium text-foreground">{opt.label}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>

            <div>
              <Label className="text-foreground text-base font-semibold">Training Experience</Label>
              <RadioGroup value={experience} onValueChange={setExperience} className="mt-3 space-y-2">
                {["beginner", "intermediate", "advanced"].map((level) => (
                  <div
                    key={level}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      experience === level
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-muted-foreground"
                    }`}
                    onClick={() => setExperience(level)}
                  >
                    <RadioGroupItem value={level} id={level} />
                    <Label htmlFor={level} className="text-foreground capitalize cursor-pointer flex-1">
                      {level}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
            <div>
              <Label className="text-foreground text-base font-semibold">Primary Goal</Label>
              <RadioGroup value={goal} onValueChange={setGoal} className="mt-3 space-y-2">
                {[
                  { value: "lose_fat", label: "Lose Fat" },
                  { value: "build_muscle", label: "Build Muscle" },
                  { value: "rebuild", label: "Rebuild Athleticism" },
                  { value: "conditioning", label: "Improve Conditioning" },
                ].map((g) => (
                  <div
                    key={g.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      goal === g.value
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-muted-foreground"
                    }`}
                    onClick={() => setGoal(g.value)}
                  >
                    <RadioGroupItem value={g.value} id={g.value} />
                    <Label htmlFor={g.value} className="text-foreground cursor-pointer flex-1">
                      {g.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            <div>
              <Label className="text-foreground text-base font-semibold">Equipment Access</Label>
              <RadioGroup value={equipment} onValueChange={setEquipment} className="mt-3 space-y-2">
                {[
                  { value: "garage_gym", label: "Garage Gym" },
                  { value: "full_gym", label: "Full Gym" },
                  { value: "minimal", label: "Minimal Equipment" },
                ].map((e) => (
                  <div
                    key={e.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      equipment === e.value
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-muted-foreground"
                    }`}
                    onClick={() => setEquipment(e.value)}
                  >
                    <RadioGroupItem value={e.value} id={e.value} />
                    <Label htmlFor={e.value} className="text-foreground cursor-pointer flex-1">
                      {e.label}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enter your estimated 1-rep maxes. Leave blank if unknown — you can update these later.
            </p>

            <div>
              <Label className="text-foreground">Bench Press (lbs)</Label>
              <Input
                type="number"
                placeholder="Optional"
                value={bench}
                onChange={(e) => setBench(e.target.value)}
                className="mt-1 bg-card border-border text-foreground"
              />
            </div>

            <div>
              <Label className="text-foreground">Squat (lbs)</Label>
              <Input
                type="number"
                placeholder="Optional"
                value={squat}
                onChange={(e) => setSquat(e.target.value)}
                className="mt-1 bg-card border-border text-foreground"
              />
            </div>

            <div>
              <Label className="text-foreground">Deadlift (lbs)</Label>
              <Input
                type="number"
                placeholder="Optional"
                value={deadlift}
                onChange={(e) => setDeadlift(e.target.value)}
                className="mt-1 bg-card border-border text-foreground"
              />
            </div>
          </div>
        )}

        {step === 4 && (
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-foreground">What have you already done?</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Check off any prep tasks you've already handled. This sets your starting readiness — you can update anytime.
              </p>
            </div>

            {milestonesLoading && (
              <p className="text-sm text-muted-foreground">Loading your list…</p>
            )}

            {!milestonesLoading && milestones.length === 0 && (
              <p className="text-sm text-muted-foreground">No prep tasks yet. You're all set.</p>
            )}

            {CATEGORIES.map((cat) => {
              const items = milestones.filter((m) => m.category_id === cat.id);
              if (items.length === 0) return null;
              const doneInCat = items.filter((m) => preCompleted.has(m.id)).length;
              return (
                <div key={cat.slug}>
                  <div className="flex items-baseline justify-between mb-2">
                    <p className="text-[11px] font-bold tracking-[0.2em] uppercase text-primary">
                      {cat.name}
                    </p>
                    <p className="text-[11px] text-muted-foreground tabular-nums">
                      {doneInCat} / {items.length}
                    </p>
                  </div>
                  <div className="space-y-2">
                    {items.map((m) => {
                      const checked = preCompleted.has(m.id);
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => togglePreCompleted(m.id)}
                          className={`w-full flex items-start gap-3 p-3 rounded-lg border text-left transition-colors ${
                            checked
                              ? "border-primary bg-primary/10"
                              : "border-border bg-card hover:border-muted-foreground"
                          }`}
                        >
                          <span className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors ${
                            checked ? "bg-primary border-primary" : "border-border"
                          }`}>
                            {checked && <Check className="w-3.5 h-3.5 text-primary-foreground" strokeWidth={3} />}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className={`text-sm font-semibold leading-tight ${checked ? "text-foreground" : "text-foreground"}`}>
                              {m.title}
                            </p>
                            {m.detail && (
                              <p className="text-xs text-muted-foreground leading-snug mt-0.5">{m.detail}</p>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {!milestonesLoading && milestones.length > 0 && (
              <p className="text-xs text-muted-foreground text-center pt-2">
                {preCompleted.size} task{preCompleted.size === 1 ? "" : "s"} marked complete
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer navigation */}
      <div className="px-4 pb-6 pt-2 max-w-md mx-auto w-full flex gap-3">
        {step > 0 && (
          <Button variant="outline" onClick={handleBack} className="flex-1 gap-2">
            <ChevronLeft className="w-4 h-4" /> Back
          </Button>
        )}
        <Button
          onClick={handleNext}
          disabled={!canAdvance() || saving}
          className="flex-1 gap-2"
        >
          {step === STEPS.length - 1 ? (saving ? "Saving..." : "Complete Setup") : "Next"}
          {step < STEPS.length - 1 && <ChevronRight className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
