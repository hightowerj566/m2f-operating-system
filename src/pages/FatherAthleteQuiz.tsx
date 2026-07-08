import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { ChevronRight, ChevronLeft, Shield, Zap } from "lucide-react";

/* ───── Questions ───── */

const QUESTIONS = [
  {
    question: "What best describes your current training experience?",
    key: "training_experience",
    answers: [
      { text: "Beginner (little to no consistent training)", value: "beginner" },
      { text: "Intermediate (training consistently 6–24 months)", value: "intermediate" },
      { text: "Advanced (training consistently 2+ years)", value: "advanced" },
    ],
  },
  {
    question: "What best describes your current body composition?",
    key: "body_composition",
    answers: [
      { text: "Lean (under ~15% body fat)", value: "lean" },
      { text: "Moderately lean (15–22%)", value: "moderate" },
      { text: "Dad bod (22–30%)", value: "dadbod" },
      { text: "Higher body fat (30%+)", value: "high" },
    ],
  },
  {
    question: "What is your main goal right now?",
    key: "goal",
    answers: [
      { text: "Lose fat and rebuild my physique", value: "fat_loss" },
      { text: "Build muscle while staying lean", value: "muscle" },
      { text: "Improve strength and athletic performance", value: "performance" },
      { text: "Become well-rounded (strength + conditioning + physique)", value: "hybrid" },
    ],
  },
  {
    question: "What equipment do you have access to?",
    key: "equipment",
    answers: [
      { text: "Full commercial gym", value: "full_gym" },
      { text: "Garage gym", value: "garage_gym" },
      { text: "Limited equipment", value: "limited" },
    ],
  },
  {
    question: "How would you rate your conditioning right now?",
    key: "conditioning",
    answers: [
      { text: "Poor – I get winded easily", value: "poor" },
      { text: "Average – I can do moderate cardio", value: "average" },
      { text: "Good – I train conditioning regularly", value: "good" },
      { text: "Athletic – I run or sprint regularly", value: "athletic" },
    ],
  },
];

/* ───── Routing Logic ───── */

export type ProgramPath = "M2F Rebuild" | "M2F Perform";

interface QuizAnswers {
  training_experience: string;
  body_composition: string;
  goal: string;
  equipment: string;
  conditioning: string;
}

export function determineProgram(answers: QuizAnswers): ProgramPath {
  // Assign to M2F Rebuild if ANY of these are true
  const rebuildTriggers = [
    answers.training_experience === "beginner",
    answers.body_composition === "dadbod" || answers.body_composition === "high",
    answers.conditioning === "poor",
    answers.goal === "fat_loss",
  ];

  if (rebuildTriggers.some(Boolean)) {
    return "M2F Rebuild";
  }

  // Otherwise M2F Perform
  return "M2F Perform";
}

/* ───── Component ───── */

export default function FatherAthleteQuiz() {
  const navigate = useNavigate();
  const quizRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const totalQuestions = QUESTIONS.length;
  const LEAD_STEP = totalQuestions;

  const startQuiz = () => {
    setStep(0);
    setTimeout(() => quizRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  };

  const selectAnswer = (value: string) => {
    const key = QUESTIONS[step].key;
    setAnswers({ ...answers, [key]: value });
    if (step < totalQuestions - 1) {
      setStep(step + 1);
    } else {
      setStep(LEAD_STEP);
    }
  };

  const progress = step >= 0 && step < totalQuestions
    ? ((step + 1) / totalQuestions) * 100
    : step === LEAD_STEP ? 100 : 0;

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim()) {
      setError("Name and email are required.");
      return;
    }
    setError("");
    setSubmitting(true);

    const quizAnswers = answers as unknown as QuizAnswers;
    const program = determineProgram(quizAnswers);

    try {
      const leadData = {
        name: name.trim(),
        email: email.trim(),
        phone: phone.trim() || "",
        archetype_type: program,
        quiz_answers: answers,
        source: "M2F Onboarding Quiz",
      };
      const { error: fnError } = await supabase.functions.invoke("submit-quiz-lead", { body: leadData });
      if (fnError) throw fnError;

      const params = new URLSearchParams({
        program,
        name: name.trim(),
        training_experience: answers.training_experience || "",
        body_composition: answers.body_composition || "",
        conditioning: answers.conditioning || "",
        equipment: answers.equipment || "",
        goal: answers.goal || "",
      });

      navigate(`/archetype-reveal?${params.toString()}`);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* INTRO */}
      {step === -1 && (
        <section className="flex flex-col items-center justify-center min-h-screen px-6 text-center">
          <div className="w-20 h-20 rounded-2xl gold-gradient flex items-center justify-center mb-8">
            <Shield className="w-10 h-10 text-primary-foreground" />
          </div>
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-4">Man to Father</p>
          <h1 className="text-4xl md:text-6xl font-black tracking-tight mb-5 max-w-2xl leading-[1.1]">
            Find Your<br />
            <span className="gold-text">Training Path</span>
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-lg mb-10 leading-relaxed">
            Answer 5 quick questions and we'll match you to the right program for your experience, goals, and lifestyle.
          </p>
          <Button
            size="lg"
            onClick={startQuiz}
            className="text-lg px-10 py-6 font-bold rounded-xl gold-gradient text-primary-foreground"
          >
            Start <ChevronRight className="ml-2 w-5 h-5" />
          </Button>
          <p className="text-muted-foreground text-sm mt-4">Takes less than 60 seconds</p>
        </section>
      )}

      {/* QUESTIONS */}
      <div ref={quizRef}>
        {step >= 0 && step < totalQuestions && (
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
              <h2 className="text-2xl md:text-3xl font-bold mb-8">{QUESTIONS[step].question}</h2>
              <div className="space-y-3">
                {QUESTIONS[step].answers.map((a, i) => (
                  <button
                    key={i}
                    onClick={() => selectAnswer(a.value)}
                    className={`w-full text-left p-4 rounded-xl border transition-all text-base md:text-lg font-medium ${
                      answers[QUESTIONS[step].key] === a.value
                        ? "border-primary bg-primary/10 glow-gold"
                        : "border-border bg-card hover:border-primary"
                    }`}
                  >
                    <span className="text-primary font-bold mr-3">
                      {String.fromCharCode(65 + i)}.
                    </span>
                    {a.text}
                  </button>
                ))}
              </div>
              {step > 0 && (
                <button
                  onClick={() => setStep(step - 1)}
                  className="mt-6 text-muted-foreground text-sm flex items-center gap-1 hover:text-foreground transition-colors"
                >
                  <ChevronLeft className="w-4 h-4" /> Back
                </button>
              )}
            </div>
          </section>
        )}

        {/* LEAD CAPTURE */}
        {step === LEAD_STEP && (
          <section className="flex flex-col items-center justify-center min-h-screen px-6 py-16">
            <div className="w-full max-w-md">
              <div className="text-center mb-8">
                <div className="w-16 h-16 rounded-full gold-gradient flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-8 h-8 text-primary-foreground" />
                </div>
                <h2 className="text-3xl font-black mb-2">Your Path is Ready</h2>
                <p className="text-muted-foreground">
                  Enter your info to see your personalized training path and program recommendation.
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
                  {submitting ? "Loading..." : "See My Path →"}
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
