// M2F OS · Training Profile.
// Collected the first time a member opens Training or Nutrition — never at signup.
// Same fields as the old fitness onboarding, minus the prep-list step. Sets
// profiles.training_profile_complete = true and generates macro_targets.

import { useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
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
import { ChevronLeft, ChevronRight, Dumbbell, User, Target, Activity } from "lucide-react";
import bfUnder15 from "@/assets/bf-under15.png";
import bf1522 from "@/assets/bf-15-22.png";
import bf2230 from "@/assets/bf-22-30.png";
import bfOver30 from "@/assets/bf-over30.png";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const STEPS = [
  { label: "You", icon: User },
  { label: "Fitness", icon: Activity },
  { label: "Goals", icon: Target },
  { label: "Strength", icon: Dumbbell },
];

const BF_OPTIONS = [
  { value: "under_15", label: "Under 15%", pct: 12, img: bfUnder15 },
  { value: "15_22", label: "15–22%", pct: 18, img: bf1522 },
  { value: "22_30", label: "22–30%", pct: 26, img: bf2230 },
  { value: "over_30", label: "30%+", pct: 35, img: bfOver30 },
];

const GOAL_MAP: Record<string, Goal> = {
  lose_fat: "cut", build_muscle: "bulk", rebuild: "maintain", conditioning: "maintain",
};

export default function TrainingProfile() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const nextParam = params.get("next"); // e.g. "today" | "macros"

  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [weight, setWeight] = useState("");
  const [age, setAge] = useState("");
  const [sex, setSex] = useState("");
  const [bodyFat, setBodyFat] = useState("");
  const [experience, setExperience] = useState("");
  const [goal, setGoal] = useState("");
  const [equipment, setEquipment] = useState("");
  const [bench, setBench] = useState("");
  const [squat, setSquat] = useState("");
  const [deadlift, setDeadlift] = useState("");

  if (loading) {
    return <div className="flex items-center justify-center min-h-dvh bg-background"><div className="text-muted-foreground">Loading...</div></div>;
  }
  if (!user) return <Navigate to="/auth" replace />;

  const progress = ((step + 1) / STEPS.length) * 100;

  const canAdvance = () => {
    switch (step) {
      case 0: return heightFt && heightIn && weight && age;
      case 1: return bodyFat && experience;
      case 2: return goal && equipment;
      case 3: return true;
      default: return false;
    }
  };

  const backToDest = () => {
    if (nextParam === "today") navigate("/?tab=Today", { replace: true });
    else if (nextParam === "macros") navigate("/?tab=Macros", { replace: true });
    else navigate("/", { replace: true });
  };

  const handleComplete = async () => {
    setSaving(true);
    try {
      const heightInches = parseInt(heightFt) * 12 + parseInt(heightIn);
      const weightLbs = parseFloat(weight);
      const userAge = parseInt(age);
      const bfPct = BF_OPTIONS.find((o) => o.value === bodyFat)?.pct ?? null;

      const { error: profileError } = await db
        .from("profiles")
        .update({
          height_inches: heightInches,
          weight_lbs: weightLbs,
          age: userAge,
          sex: sex || null,
          body_fat_pct: bfPct,
          body_composition_category: bodyFat,
          training_experience: experience,
          goal,
          equipment_access: equipment,
          training_profile_complete: true,
        })
        .eq("user_id", user.id);
      if (profileError) throw profileError;

      const maxes: { exercise_name: string; weight_lbs: number }[] = [];
      if (bench) maxes.push({ exercise_name: "Bench Press", weight_lbs: parseFloat(bench) });
      if (squat) maxes.push({ exercise_name: "Squat", weight_lbs: parseFloat(squat) });
      if (deadlift) maxes.push({ exercise_name: "Deadlift", weight_lbs: parseFloat(deadlift) });
      if (maxes.length) {
        await db.from("user_maxes").upsert(
          maxes.map((m) => ({ ...m, user_id: user.id })),
          { onConflict: "user_id,exercise_name" }
        );
      }

      const result = calculateTDEE({
        weight_lbs: weightLbs, height_inches: heightInches, age: userAge,
        sex: (sex as Sex) || "male", avg_daily_steps: 7000,
        training_days_per_week: 4, job_type: "desk" as JobType,
        body_fat_pct: bfPct, goal: GOAL_MAP[goal] || "maintain",
      });
      await db.from("macro_targets").upsert({
        user_id: user.id,
        calories: result.target_calories,
        protein_g: result.protein_g,
        carbs_g: result.carbs_g,
        fat_g: result.fat_g,
      }, { onConflict: "user_id" });

      toast({ title: "Training profile saved." });
      backToDest();
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast({ title: "Error", description: (err as any)?.message || "Failed to save.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col pt-safe pb-safe">
      <div className="px-4 pt-6 pb-2">
        <button onClick={backToDest} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" /> Skip for now
        </button>
        <h1 className="text-xl font-bold text-foreground text-center mt-2">Personalize your training</h1>
        <p className="text-sm text-muted-foreground text-center mt-1">
          Step {step + 1} of {STEPS.length} — {STEPS[step].label}
        </p>
        <Progress value={progress} className="mt-4 h-2" />
      </div>

      <div className="flex-1 px-4 py-6 max-w-md mx-auto w-full">
        {step === 0 && (
          <div className="space-y-4">
            <div>
              <Label className="text-foreground">Height</Label>
              <div className="flex gap-2 mt-1">
                <Input type="number" placeholder="Feet" value={heightFt} onChange={(e) => setHeightFt(e.target.value)} min={3} max={8} className="bg-card border-border text-foreground" />
                <Input type="number" placeholder="Inches" value={heightIn} onChange={(e) => setHeightIn(e.target.value)} min={0} max={11} className="bg-card border-border text-foreground" />
              </div>
            </div>
            <div>
              <Label className="text-foreground">Weight (lbs)</Label>
              <Input type="number" placeholder="185" value={weight} onChange={(e) => setWeight(e.target.value)} className="mt-1 bg-card border-border text-foreground" />
            </div>
            <div>
              <Label className="text-foreground">Age</Label>
              <Input type="number" placeholder="35" value={age} onChange={(e) => setAge(e.target.value)} className="mt-1 bg-card border-border text-foreground" />
            </div>
            <div>
              <Label className="text-foreground">Gender (optional)</Label>
              <Select value={sex} onValueChange={setSex}>
                <SelectTrigger className="mt-1 bg-card border-border text-foreground"><SelectValue placeholder="Select" /></SelectTrigger>
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
                  <Card key={opt.value}
                    className={`cursor-pointer transition-all ${bodyFat === opt.value ? "ring-2 ring-primary border-primary" : "border-border hover:border-muted-foreground"}`}
                    onClick={() => setBodyFat(opt.value)}>
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
                  <div key={level}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${experience === level ? "border-primary bg-primary/10" : "border-border bg-card hover:border-muted-foreground"}`}
                    onClick={() => setExperience(level)}>
                    <RadioGroupItem value={level} id={level} />
                    <Label htmlFor={level} className="text-foreground capitalize cursor-pointer flex-1">{level}</Label>
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
                  <div key={g.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${goal === g.value ? "border-primary bg-primary/10" : "border-border bg-card hover:border-muted-foreground"}`}
                    onClick={() => setGoal(g.value)}>
                    <RadioGroupItem value={g.value} id={g.value} />
                    <Label htmlFor={g.value} className="text-foreground cursor-pointer flex-1">{g.label}</Label>
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
                  <div key={e.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${equipment === e.value ? "border-primary bg-primary/10" : "border-border bg-card hover:border-muted-foreground"}`}
                    onClick={() => setEquipment(e.value)}>
                    <RadioGroupItem value={e.value} id={e.value} />
                    <Label htmlFor={e.value} className="text-foreground cursor-pointer flex-1">{e.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Enter your estimated 1-rep maxes. Leave blank if unknown — you can update these later.</p>
            <div>
              <Label className="text-foreground">Bench Press (lbs)</Label>
              <Input type="number" placeholder="Optional" value={bench} onChange={(e) => setBench(e.target.value)} className="mt-1 bg-card border-border text-foreground" />
            </div>
            <div>
              <Label className="text-foreground">Squat (lbs)</Label>
              <Input type="number" placeholder="Optional" value={squat} onChange={(e) => setSquat(e.target.value)} className="mt-1 bg-card border-border text-foreground" />
            </div>
            <div>
              <Label className="text-foreground">Deadlift (lbs)</Label>
              <Input type="number" placeholder="Optional" value={deadlift} onChange={(e) => setDeadlift(e.target.value)} className="mt-1 bg-card border-border text-foreground" />
            </div>
          </div>
        )}
      </div>

      <div className="px-4 pb-6 max-w-md mx-auto w-full flex gap-3">
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
            <ChevronLeft className="w-4 h-4 mr-1" /> Back
          </Button>
        )}
        <Button
          onClick={() => (step < STEPS.length - 1 ? setStep(step + 1) : handleComplete())}
          disabled={!canAdvance() || saving}
          className="flex-1"
        >
          {saving ? "Saving..." : step < STEPS.length - 1 ? "Next" : "Finish"} <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
