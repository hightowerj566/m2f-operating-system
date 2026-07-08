// M2F OS · The Readiness Assessment (rewritten from the Father Athlete quiz).
// Public funnel + in-app onboarding in one flow:
//   intro → due date → 14 scored + 3 routing questions → email opt-in → /score-reveal
// D3: opt-in ALWAYS gates the reveal. Leads write to father_athlete_leads with score payload.

import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { ChevronRight, ChevronLeft, Shield, Zap } from "lucide-react";
import { useAssessmentQuestions, saveAssessment } from "@/hooks/useReadiness";
import {
  CATEGORIES,
  scoreAssessment,
  routeTrack,
  weeksRemaining as calcWeeksRemaining,
  type AssessmentQuestion,
} from "@/lib/readiness";

export const REVEAL_STORAGE_KEY = "m2f_readiness_result";

const INTRO_STEP = -3;
const DUE_STEP = -2; // questions start at 0

export default function FatherAthleteQuiz() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const quizRef = useRef<HTMLDivElement>(null);
  const { data: questions = [], isLoading } = useAssessmentQuestions();

  const [step, setStep] = useState(INTRO_STEP);
  const [dueDate, setDueDate] = useState("");
  const [pointsByCode, setPointsByCode] = useState<Record<string, number>>({});
  const [routingByCode, setRoutingByCode] = useState<Record<string, string>>({});
  const [labelByCode, setLabelByCode] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [dueDatePrefilled, setDueDatePrefilled] = useState(false);

  const totalQuestions = questions.length;
  const LEAD_STEP = totalQuestions;

  // If the profile already has a due_date (set during /start), skip that step.
  useEffect(() => {
    if (!user?.id) return;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("profiles")
      .select("due_date")
      .eq("user_id", user.id)
      .maybeSingle()
      .then(({ data }: { data: { due_date: string | null } | null }) => {
        if (data?.due_date) {
          setDueDate(data.due_date);
          setDueDatePrefilled(true);
        }
      });
  }, [user?.id]);

  const categoryFor = (question: AssessmentQuestion) =>
    CATEGORIES.find((c) => c.id === question.category_id)?.name ?? "TRAINING SETUP";

  const startAssessment = () => {
    // Skip the due-date step entirely when we already have it.
    setStep(dueDatePrefilled ? 0 : DUE_STEP);
    setTimeout(() => quizRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const confirmDueDate = () => {
    if (!dueDate) {
      setError("Enter your due date — the whole system runs on the clock.");
      return;
    }
    setError("");
    setStep(0);
  };

  const selectAnswer = (question: AssessmentQuestion, optionIndex: number) => {
    const option = question.options[optionIndex];
    setLabelByCode((prev) => ({ ...prev, [question.code]: option.label }));
    if (question.kind === "scored") {
      setPointsByCode((prev) => ({ ...prev, [question.code]: option.points ?? 0 }));
    } else {
      setRoutingByCode((prev) => ({ ...prev, [question.code]: option.routing_value ?? "" }));
    }
    setStep((s) => (s < totalQuestions - 1 ? s + 1 : LEAD_STEP));
  };

  const progress =
    step >= 0 && step < totalQuestions
      ? ((step + 1) / totalQuestions) * 100
      : step === LEAD_STEP
        ? 100
        : 0;

  const result = useMemo(() => scoreAssessment(pointsByCode, questions), [pointsByCode, questions]);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required to get your breakdown.");
      return;
    }
    setError("");
    setSubmitting(true);

    const track = routeTrack(routingByCode);
    const weeks = calcWeeksRemaining(dueDate);
    const answersPayload = {
      due_date: dueDate,
      labels: labelByCode,
      points: pointsByCode,
      routing: routingByCode,
    };

    try {
      // Lead capture (always — this is the opt-in gate)
      const leadData = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || "",
        archetype_type: track,
        quiz_answers: answersPayload,
        source: "M2F Readiness Assessment",
        total_score: result.total,
        category_scores: result.byCategory,
        weakest_category: result.weakest.slug,
        due_date: dueDate,
      };
      const { error: fnError } = await supabase.functions.invoke("submit-quiz-lead", {
        body: leadData,
      });
      if (fnError) throw fnError;

      // Logged-in users also get a versioned snapshot + profile stamp
      if (user?.id) {
        await saveAssessment({
          userId: user.id,
          result,
          weeksRemaining: weeks,
          answers: answersPayload,
          dueDate,
          track,
        });
      }

      const revealState = {
        total: result.total,
        byCategory: result.byCategory,
        weakest: result.weakest.slug,
        weeksRemaining: weeks,
        dueDate,
        track,
        name: name.trim(),
      };
      sessionStorage.setItem(REVEAL_STORAGE_KEY, JSON.stringify(revealState));
      navigate("/score-reveal", { state: revealState });
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* INTRO */}
      {step === INTRO_STEP && (
        <section className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <div className="w-20 h-20 rounded-2xl gold-gradient flex items-center justify-center mb-8">
            <Shield className="w-10 h-10 text-primary-foreground" />
          </div>
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-4">Man to Father</p>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-5 max-w-2xl leading-[1.1]">
            The Readiness<br />
            <span className="gold-text">Score</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-lg mb-2 leading-relaxed">
            Seven categories. One number out of 70. How ready are you — actually?
          </p>
          <p className="text-muted-foreground text-base max-w-lg mb-10">
            Be honest. The score only helps if it's true.
          </p>
          <Button
            size="lg"
            onClick={startAssessment}
            disabled={isLoading}
            className="text-lg px-10 py-6 font-bold rounded-xl gold-gradient text-primary-foreground"
          >
            {isLoading ? "Loading..." : "Get My Score"} <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-muted-foreground text-sm mt-4">Takes 2 minutes</p>
        </section>
      )}

      <div ref={quizRef}>
        {/* DUE DATE */}
        {step === DUE_STEP && (
          <section className="flex flex-col items-center justify-center min-h-screen px-6 py-16">
            <div className="w-full max-w-md text-center">
              <p className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-3">The Clock</p>
              <h2 className="text-3xl font-black mb-3">When is she due?</h2>
              <p className="text-muted-foreground mb-8">
                Everything in this system runs against your due date. Fatherhood has a deadline — yours starts now.
              </p>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-lg py-6 text-center"
              />
              {error && <p className="text-destructive text-sm mt-3">{error}</p>}
              <Button
                onClick={confirmDueDate}
                className="w-full text-lg py-6 font-bold gold-gradient text-primary-foreground rounded-xl mt-6"
              >
                Start the Assessment <ChevronRight className="ml-2 w-5 h-5" />
              </Button>
              <button
                onClick={() => setStep(INTRO_STEP)}
                className="mt-4 text-muted-foreground text-sm flex items-center gap-1 hover:text-foreground transition-colors mx-auto"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            </div>
          </section>
        )}

        {/* QUESTIONS */}
        {step >= 0 && step < totalQuestions && questions[step] && (
          <section className="flex flex-col items-center justify-center min-h-screen px-6 py-16">
            <div className="w-full max-w-lg mb-2">
              <div className="flex justify-between text-xs text-muted-foreground mb-1">
                <span>Question {step + 1} of {totalQuestions}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="compliance-bar w-full">
                <div
                  className="compliance-fill"
                  style={{ width: `${progress}%`, transition: "width 0.3s ease" }}
                />
              </div>
            </div>

            <div className="w-full max-w-lg mt-8">
              <p className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-2">
                {categoryFor(questions[step])}
              </p>
              <h2 className="text-2xl md:text-3xl font-bold mb-8">{questions[step].prompt}</h2>
              <div className="space-y-3">
                {questions[step].options.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => selectAnswer(questions[step], i)}
                    className={`w-full text-left p-4 rounded-xl border transition-all text-base md:text-lg font-medium ${
                      labelByCode[questions[step].code] === option.label
                        ? "border-primary bg-primary/10 glow-gold"
                        : "border-border bg-card hover:border-primary"
                    }`}
                  >
                    <span className="text-primary font-bold mr-3">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {option.label}
                  </button>
                ))}
              </div>
              <button
                onClick={() => setStep(step === 0 ? (dueDatePrefilled ? INTRO_STEP : DUE_STEP) : step - 1)}
                className="mt-6 text-muted-foreground text-sm flex items-center gap-1 hover:text-foreground transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            </div>
          </section>
        )}

        {/* EMAIL OPT-IN — gates the reveal (D3) */}
        {step === LEAD_STEP && totalQuestions > 0 && (
          <section className="flex flex-col items-center justify-center min-h-screen px-6 py-16">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="text-3xl font-black mb-2">Your Score is Ready</h2>
                <p className="text-muted-foreground">
                  Where do we send your full 7-category breakdown?
                </p>
              </div>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">First Name</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your first name"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@email.com"
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone Number <span className="text-muted-foreground text-xs">(optional)</span></Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(555) 123-4567"
                    className="mt-1"
                  />
                </div>
                {error && <p className="text-destructive text-sm">{error}</p>}
                <Button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="w-full text-lg py-6 font-bold gold-gradient text-primary-foreground rounded-xl mt-2"
                >
                  {submitting ? "Scoring..." : "Reveal My Score →"}
                </Button>
              </div>
              <button
                onClick={() => setStep(totalQuestions - 1)}
                className="mt-4 text-muted-foreground text-sm flex items-center gap-1 hover:text-foreground transition-colors mx-auto"
              >
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
