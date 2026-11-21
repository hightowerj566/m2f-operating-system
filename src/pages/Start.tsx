// M2F OS · Public welcome and member onboarding (S1–S3).
// Signed-out visitors arriving from partner resources see a public introduction.
// Signed-in members continue through due date → assessment → readiness plan.
// Training Mode users can skip the due date and answer training-only questions.

import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { getDueDateCountdown } from "@/lib/dueDateCountdown";
import { routeTrack } from "@/lib/readiness";
import { ensureTrackAssignment } from "@/hooks/useReadiness";

type Step = "welcome" | "due" | "punch" | number | "saving"; // numbers = assessment questions

interface Q {
  key: string;
  prompt: string;
  options?: { label: string; value: string | number | boolean }[];
  input?: "text" | "number";
  placeholder?: string;
}

const BABY_KEYS = new Set(["first_child", "partner_name", "biggest_fear"]);

const QUESTIONS: Q[] = [
  { key: "first_child", prompt: "Is this your first?", options: [
    { label: "First one", value: true }, { label: "I've done this before", value: false },
  ]},
  { key: "training_experience", prompt: "Training experience:", options: [
    { label: "Under a year", value: "under_1yr" }, { label: "1–3 years", value: "1_3yr" }, { label: "3+ years consistent", value: "3plus" },
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
  const [trainingOnly, setTrainingOnly] = useState(false);
  const [upgrading, setUpgrading] = useState(false);
  const [textDraft, setTextDraft] = useState("");
  const [error, setError] = useState("");

  // Only the authenticated member's own profile may pre-fill this flow.
  // Cancellation prevents a previous account's request from populating a new one.
  useEffect(() => {
    let active = true;
    setStep("welcome");
    setDueDate("");
    setUpgrading(false);
    if (!user?.id) return () => { active = false; };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("profiles")
      .select("journey, due_date")
      .eq("user_id", user.id)
      .maybeSingle()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .then(({ data: prof }: any) => {
        if (!active) return;
        if (getDueDateCountdown(prof?.due_date)) setDueDate(prof.due_date);
        if (prof?.journey === "training" && !prof?.due_date) {
          setUpgrading(true);
          setStep("due");
        }
      });

    return () => { active = false; };
  }, [user?.id]);

  const countdown = getDueDateCountdown(dueDate);
  const activeQuestions = trainingOnly
    ? QUESTIONS.filter((qq) => !BABY_KEYS.has(qq.key))
    : upgrading
      ? QUESTIONS.filter((qq) => BABY_KEYS.has(qq.key))
      : QUESTIONS;

  const begin = () => {
    if (!user) {
      navigate("/auth?mode=signup");
      return;
    }
    setError("");
    setStep(countdown ? "punch" : "due");
  };

  const finish = async (final: Record<string, string | number | boolean>) => {
    if (!user) return;
    setStep("saving");
    const scriptureOff = final.faith_practicing === false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any;
    const profileUpdate: Record<string, unknown> = {
      ...final,
      journey: trainingOnly ? "training" : "expecting",
    };
    if (!trainingOnly && countdown) profileUpdate.due_date = dueDate;
    await db.from("profiles").update(profileUpdate).eq("user_id", user.id);

    // Training Mode: route + enroll the track now (no Readiness quiz required)
    if (trainingOnly) {
      const daysVal = Number(final.training_days ?? 3);
      const r3 = daysVal >= 5 ? "5plus" : String(daysVal);
      const gym = String(final.gym_access ?? "home_setup");
      const r2 = gym === "hybrid" ? "home_setup" : gym;
      const track = routeTrack({ R1: String(final.training_experience ?? "under_1yr"), R2: r2, R3: r3 });
      await ensureTrackAssignment(user.id, track);
    }
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
    navigate(trainingOnly ? "/" : "/readiness/assessment");
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
    if (i < activeQuestions.length - 1) setStep(i + 1);
    else finish(next);
  };

  const qIndex = typeof step === "number" ? step : -1;
  const q = qIndex >= 0 ? activeQuestions[qIndex] : null;

  if (loading) {
    return (
      <div className="min-h-dvh bg-background text-foreground flex items-center justify-center" aria-label="Loading Man to Father">
        <img src="/favicon.png" alt="Man to Father" className="h-16 w-16 object-contain" />
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background text-foreground flex flex-col items-center justify-center px-6 py-10 pt-safe pb-safe">
      {/* Public welcome · also the first step for signed-in members */}
      {step === "welcome" && (
        <div className="text-center max-w-xl w-full">
          <img src="/favicon.png" alt="Man to Father" className="h-20 w-20 object-contain mx-auto mb-5" />
          <p className="text-xs font-bold tracking-[0.28em] uppercase text-primary mb-5">For expecting & new dads</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-[1.08] mb-5">
            Your baby is coming.<br /><span className="gold-text">Be ready for fatherhood.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground leading-relaxed mb-7 max-w-lg mx-auto">
            Man to Father combines training, nutrition, and a practical fatherhood roadmap so you know how to care for your body, support your partner, and prepare for your baby.
          </p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-3 max-w-md mx-auto mb-8 text-sm font-semibold text-foreground">
            <span>Father Forge</span>
            <span>Partner Strong</span>
            <span>Fatherhood Prep</span>
            <span>Father Fuel</span>
          </div>
          <Button
            size="lg"
            onClick={begin}
            className="w-full sm:w-auto text-lg px-12 py-6 font-bold rounded-xl gold-gradient text-primary-foreground"
          >
            {user ? "Begin My Plan" : "Get Started"} <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
          {!user && (
            <button
              onClick={() => navigate("/auth?next=%2Fstart")}
              className="mt-5 text-muted-foreground text-sm hover:text-foreground transition-colors underline underline-offset-4 mx-auto block"
            >
              Already a member? Log in
            </button>
          )}
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
            onChange={(e) => { setDueDate(e.target.value); setError(""); }}
            className="text-lg py-6 text-center"
          />
          <Button
            onClick={() => (countdown ? setStep("punch") : setError("Enter a valid due date."))}
            className="w-full text-lg py-6 font-bold gold-gradient text-primary-foreground rounded-xl mt-6"
          >
            Set The Clock <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
          {error && <p className="text-destructive text-sm mt-3">{error}</p>}
          {!upgrading && (
            <button
              onClick={() => { setTrainingOnly(true); setStep(0); }}
              className="mt-6 text-muted-foreground text-sm hover:text-foreground transition-colors underline underline-offset-4 mx-auto block"
            >
              No baby on the way yet — I'm just here to train
            </button>
          )}
          <p className="text-[10px] text-muted-foreground mt-2">You can set the date anytime later and the full system switches on.</p>
        </div>
      )}

      {/* A countdown is rendered only for a valid calendar date. */}
      {step === "punch" && countdown && (
        <div className="text-center max-w-lg w-full">
          {countdown.status === "past" ? (
            <div data-testid="postpartum-message">
              <p className="text-sm text-primary mb-4 tracking-widest uppercase font-bold">Your due date has passed</p>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-tight mb-5">Be present for what comes next.</h1>
              <p className="text-lg text-muted-foreground leading-relaxed mb-10">
                If your baby is here, focus on recovery, rest, and showing up for your family. M2F will help you keep the next steps clear.
              </p>
            </div>
          ) : countdown.status === "due-today" ? (
            <div data-testid="due-today-message">
              <p className="text-sm text-primary mb-4 tracking-widest uppercase font-bold">Today is your due date</p>
              <h1 className="text-5xl md:text-6xl font-black tracking-tight gold-text leading-none mb-5">Stay ready.</h1>
              <p className="text-lg text-muted-foreground mb-10">Stay close, stay present, and be available for your partner.</p>
            </div>
          ) : (
            <div data-testid="due-countdown" data-days={countdown.days}>
              <p className="text-sm text-muted-foreground mb-4 tracking-widest uppercase">She arrives in</p>
              <h1 className="text-8xl font-black tracking-tight gold-text leading-none">{countdown.days}</h1>
              <p className="text-2xl font-bold mt-2 mb-1">{countdown.days === 1 ? "DAY" : "DAYS"}</p>
              <p className="text-muted-foreground mb-10">That's the runway. Let's use every one of them.</p>
            </div>
          )}
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
            <span>{qIndex + 1} of {activeQuestions.length}</span>
          </div>
          <div className="compliance-bar w-full mb-8">
            <div className="compliance-fill" style={{ width: `${((qIndex + 1) / activeQuestions.length) * 100}%`, transition: "width 0.3s ease" }} />
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
            onClick={() => (qIndex === 0 ? setStep(trainingOnly ? "due" : "punch") : setStep(qIndex - 1))}
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
