// M2F OS · Onboarding (S1–S3): Welcome → The Countdown → The Man Assessment.
// Ends by routing into the Readiness Assessment (S4), which reveals the score
// and hands off to the 73-day plan (S5, /plan).

import { useEffect, useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { daysRemaining } from "@/lib/phases";

type Step = "welcome" | "due" | "punch" | number | "saving"; // numbers = assessment questions

interface Q {
  key: string;
  prompt: string;
  options?: { label: string; value: string | number | boolean }[];
  input?: "text" | "number";
  placeholder?: string;
}

const QUESTIONS: Q[] = [
  { key: "first_child", prompt: "Is this your first?", options: [
    { label: "First one", value: true }, { label: "I've done this before", value: false },
  ]},
  { key: "training_days", prompt: "Days per week you can actually train:", options: [
    { label: "3", value: 3 }, { label: "4", value: 4 }, { label: "5", value: 5 }, { label: "6", value: 6 },
  ]},
  { key: "session_length_min", prompt: "How long is a realistic session?", options: [
    { label: "30 min", value: 30 }, { label: "45 min", value: 45 }, { label: "60 min", value: 60 }, { label: "75+ min", value: 75 },
  ]},
  { key: "gym_access", prompt: "Where do you train?", options: [
    { label: "Full gym", value: "full_gym" }, { label: "Home setup", value: "home_setup" }, { label: "Hybrid / it varies", value: "hybrid" },
  ]},
  { key: "goal", prompt: "Primary physical goal before she arrives:", options: [
    { label: "Lose fat", value: "fat_loss" }, { label: "Build muscle", value: "muscle_gain" }, { label: "Stay strong & durable", value: "maintenance" },
  ]},
  { key: "partner_name", prompt: "What's your wife's name?", input: "text", placeholder: "So the app can talk about her like a person, not a variable" },
  { key: "biggest_fear", prompt: "Biggest fear about becoming a dad. One honest sentence.", input: "text", placeholder: "Nobody sees this but you (and the app that coaches you)" },
  { key: "faith_practicing", prompt: "Is faith part of your daily life?", options: [
    { label: "Yes", value: true }, { label: "No / not right now", value: false },
  ]},
];

export default function Start() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>("welcome");
  const [dueDate, setDueDate] = useState("");
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({});
  const [textDraft, setTextDraft] = useState("");
  const [error, setError] = useState("");

  // If the profile already has a due_date (e.g. set in the readiness quiz),
  // pre-fill and skip the "due" step.
  useEffect(() => {
    if (!user?.id) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("profiles")
      .select("due_date")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: { data: { due_date: string | null } | null }) => {
        if (data?.due_date) setDueDate(data.due_date);
      });
  }, [user?.id]);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const days = daysRemaining(dueDate || null);

  const finish = async (final: Record<string, string | number | boolean>) => {
    setStep("saving");
    const scriptureOff = final.faith_practicing === false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    await db.from("profiles").update({ ...final, due_date: dueDate }).eq("user_id", user.id);
    if (scriptureOff) {
      // Respect his answer: pre-toggle the scripture standard off (he can re-enable anytime)
      const { data: def } = await db
        .from("standard_definitions")
        .select("id")
        .eq("key", "scripture_read")
        .eq("is_global", true)
        .limit(1);
      if (def?.[0]?.id) {
        await db.from("user_standard_prefs").upsert(
          { user_id: user.id, standard_definition_id: def[0].id, enabled: false },
          { onConflict: "user_id,standard_definition_id" },
        );
      }
    }
    navigate("/readiness");
  };

  const answerOption = (q: Q, value: string | number | boolean) => {
    const next = { ...answers, [q.key]: value };
    setAnswers(next);
    advance(next);
  };

  const answerText = (q: Q) => {
    if (!textDraft.trim()) { setError("Give it to me straight — one line."); return; }
    setError("");
    const next = { ...answers, [q.key]: textDraft.trim().slice(0, 300) };
    setAnswers(next);
    setTextDraft("");
    advance(next);
  };

  const advance = (next: Record<string, string | number | boolean>) => {
    const i = typeof step === "number" ? step : -1;
    if (i < QUESTIONS.length - 1) setStep(i + 1);
    else finish(next);
  };

  const qIndex = typeof step === "number" ? step : -1;
  const q = qIndex >= 0 ? QUESTIONS[qIndex] : null;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6">
      {/* S1 · WELCOME */}
      {step === "welcome" && (
        <div className="text-center max-w-md">
          <p className="text-xs font-bold tracking-[0.35em] uppercase text-primary mb-6">Man to Father</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.15] mb-4">
            You have one shot at becoming her father.
          </h1>
          <p className="text-xl text-muted-foreground mb-10">Let's build the man first.</p>
          <Button
            size="lg"
            onClick={() => setStep(dueDate ? "punch" : "due")}
            className="text-lg px-12 py-6 font-bold rounded-xl gold-gradient text-primary-foreground"
          >
            Begin <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      )}

      {/* S2 · THE COUNTDOWN */}
      {step === "due" && (
        <div className="text-center max-w-md w-full">
          <h2 className="text-3xl font-black mb-2">When is she due?</h2>
          <p className="text-muted-foreground mb-8">One date. It becomes the engine of everything.</p>
          <Input
            type="date"
            value={dueDate}
            onChange={(e) => setDueDate(e.target.value)}
            className="text-lg py-6 text-center"
          />
          <Button
            onClick={() => (dueDate ? setStep("punch") : setError("Enter the date."))}
            className="w-full text-lg py-6 font-bold gold-gradient text-primary-foreground rounded-xl mt-6"
          >
            Set The Clock <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
          {error && <p className="text-destructive text-sm mt-3">{error}</p>}
        </div>
      )}

      {/* S2b · THE PUNCH */}
      {step === "punch" && (
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-4 tracking-widest uppercase">She arrives in</p>
          <h1 className="text-8xl font-black tracking-tight gold-text leading-none">{days}</h1>
          <p className="text-2xl font-bold mt-2 mb-1">DAYS</p>
          <p className="text-muted-foreground mb-10">That's the runway. Let's use every one of them.</p>
          <Button
            size="lg"
            onClick={() => setStep(0)}
            className="text-lg px-10 py-6 font-bold rounded-xl gold-gradient text-primary-foreground"
          >
            Build My Plan <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
        </div>
      )}

      {/* S3 · THE MAN ASSESSMENT */}
      {q && (
        <div className="w-full max-w-md">
          <div className="flex justify-between text-xs text-muted-foreground mb-1">
            <span>{qIndex + 1} of {QUESTIONS.length}</span>
          </div>
          <div className="compliance-bar w-full mb-8">
            <div className="compliance-fill" style={{ width: `${((qIndex + 1) / QUESTIONS.length) * 100}%`, transition: "width 0.3s ease" }} />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-8">{q.prompt}</h2>
          {q.options ? (
            <div className="space-y-3">
              {q.options.map((o, i) => (
                <button
                  key={i}
                  onClick={() => answerOption(q, o.value)}
                  className="w-full text-left p-4 rounded-xl border border-border bg-card hover:border-primary transition-all text-base md:text-lg font-medium"
                >
                  {o.label}
                </button>
              ))}
            </div>
          ) : (
            <div>
              <Input
                value={textDraft}
                onChange={(e) => setTextDraft(e.target.value)}
                placeholder={q.placeholder}
                className="text-base py-6"
                onKeyDown={(e) => e.key === "Enter" && answerText(q)}
              />
              {error && <p className="text-destructive text-sm mt-2">{error}</p>}
              <Button
                onClick={() => answerText(q)}
                className="w-full text-lg py-6 font-bold gold-gradient text-primary-foreground rounded-xl mt-4"
              >
                Next <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
            </div>
          )}
          <button
            onClick={() => (qIndex === 0 ? setStep("punch") : setStep(qIndex - 1))}
            className="mt-6 text-muted-foreground text-sm flex items-center gap-1 hover:text-foreground transition-colors"
          >
            <ChevronLeft className="w-4 h-4" /> Back
          </button>
        </div>
      )}

      {step === "saving" && <p className="text-muted-foreground">Locking it in…</p>}
    </div>
  );
}
