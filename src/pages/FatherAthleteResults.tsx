import { useState, useRef, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ChevronRight,
  CheckCircle2,
  ArrowDown,
  Calendar,
  Flame,
  Zap,
  Heart,
} from "lucide-react";
import type { ProgramPath } from "./FatherAthleteQuiz";

/* ───── Program Data ───── */

const PROGRAM_INFO: Record<ProgramPath, { title: string; description: string; icon: typeof Flame }> = {
  "M2F Rebuild": {
    title: "Your Path: M2F Rebuild",
    description:
      "M2F Rebuild is designed for men rebuilding their physique, dropping body fat, and regaining strength and conditioning.",
    icon: Flame,
  },
  "M2F Perform": {
    title: "Your Path: M2F Perform",
    description:
      "M2F Perform is designed for men who want to train like hybrid athletes while building strength, muscle, and elite conditioning.",
    icon: Zap,
  },
};

// Map quiz program names to database program names

/* ───── Commitment Quiz Constants ───── */


const TIMELINES = [
  { label: "Start today", icon: "🔥" },
  { label: "Start this week", icon: "📅" },
  { label: "Start next week", icon: "⏳" },
  { label: "Just exploring for now", icon: "👀" },
];

const MILESTONES = [
  { weeks: "Week 1–2", text: "Build training consistency" },
  { weeks: "Week 3–4", text: "Noticeable increase in strength and energy" },
  { weeks: "Week 6–8", text: "Visible body composition improvements" },
  { weeks: "Week 12", text: "Strong, lean, and more athletic" },
];

const STANDARDS = [
  { metric: "20 pushups", icon: "💪" },
  { metric: "5 pullups", icon: "🏋️" },
  { metric: "1 mile run under 9 minutes", icon: "🏃" },
];

/* ───── Funnel steps ───── */
type FunnelStep = "results" | "plan" | "offer";

export default function FatherAthleteResults() {
  const [params] = useSearchParams();
  const program = (params.get("program") || "M2F Rebuild") as ProgramPath;
  const firstName = params.get("name") || "Dad";

  const info = PROGRAM_INFO[program] || PROGRAM_INFO["M2F Rebuild"];
  const Icon = info.icon;

  const [funnelStep, setFunnelStep] = useState<FunnelStep>("results");
  const [startCommitment, setStartCommitment] = useState("");
  const [isAtBottom, setIsAtBottom] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

  useEffect(() => {
    const handleScroll = () => {
      if (!scrollContainerRef.current) return;
      const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
      setIsAtBottom(scrollHeight - scrollTop - clientHeight < 50);
    };
    const container = scrollContainerRef.current;
    container?.addEventListener("scroll", handleScroll);
    setTimeout(handleScroll, 100);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, [funnelStep]);

  const goTo = (step: FunnelStep) => {
    setFunnelStep(step);
    scrollTop();
  };

  /* ───── STEP: RESULTS (Program Assignment) ───── */
  if (funnelStep === "results") {
    return (
      <div ref={scrollContainerRef} className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center px-6 py-16 overflow-y-auto max-h-screen">
        <div className="max-w-lg mx-auto text-center">
          <div className="w-20 h-20 rounded-full gold-gradient flex items-center justify-center mx-auto mb-6">
            <Icon className="w-10 h-10 text-primary-foreground" />
          </div>

          <p className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-4">
            Your Training Path
          </p>

          <h1 className="text-3xl md:text-5xl font-black tracking-tight mb-4 leading-[1.1]">
            {firstName}, your path is<br />
            <span className="gold-text">{program}</span>
          </h1>

          <div className="card-dark rounded-xl p-6 mb-8 text-left">
            <h2 className="text-xl font-black gold-text mb-2">{info.title}</h2>
            <p className="text-muted-foreground text-base leading-relaxed">
              {info.description}
            </p>
          </div>

          {/* Program comparison */}
          <div className="grid grid-cols-2 gap-3 mb-8">
            {(Object.keys(PROGRAM_INFO) as ProgramPath[]).map((p) => {
              const isActive = p === program;
              const PIcon = PROGRAM_INFO[p].icon;
              return (
                <div
                  key={p}
                  className={`rounded-xl p-4 border transition-all ${
                    isActive
                      ? "border-primary bg-primary/10 glow-gold"
                      : "border-border bg-card opacity-50"
                  }`}
                >
                  <PIcon className={`w-5 h-5 mx-auto mb-2 ${isActive ? "text-primary" : "text-muted-foreground"}`} />
                  <p className={`text-sm font-bold ${isActive ? "text-primary" : "text-muted-foreground"}`}>
                    {p}
                  </p>
                  {isActive && (
                    <p className="text-[10px] text-muted-foreground mt-1">← Your path</p>
                  )}
                </div>
              );
            })}
          </div>

          <div className="flex flex-col items-center gap-2 mt-6 text-muted-foreground animate-bounce">
            <ArrowDown className="w-5 h-5" />
            <p className="text-xs">Scroll down to continue</p>
          </div>
        </div>

        {/* Inline: When do you want to start? */}
        <div className="max-w-lg mx-auto mt-16 w-full">
          <div className="text-center mb-6">
            <div className="w-12 h-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto mb-3">
              <Calendar className="w-6 h-6 text-primary" />
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight mb-2">
              When do you want to <span className="gold-text">start?</span>
            </h2>
            <p className="text-muted-foreground text-sm">
              Your journey to becoming a stronger father begins with a decision.
            </p>
          </div>

          <div className="space-y-2">
            {TIMELINES.map((t) => {
              const selected = startCommitment === t.label;
              return (
                <button
                  key={t.label}
                  onClick={() => {
                    setStartCommitment(t.label);
                    goTo("plan");
                  }}
                  className={`w-full text-left p-4 rounded-xl border transition-all flex items-center gap-3 ${
                    selected
                      ? "border-primary bg-primary/10 glow-gold"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <span className="text-xl">{t.icon}</span>
                  <span className={`text-base font-semibold ${selected ? "text-foreground" : "text-muted-foreground"}`}>
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }




  /* ───── STEP: PERSONALIZED PLAN ───── */
  if (funnelStep === "plan") {
    return (
      <div ref={scrollContainerRef} className="min-h-screen bg-background text-foreground overflow-y-auto max-h-screen">
        <section className="flex flex-col items-center px-6 py-20 text-center">
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-4">Your Personalized Program</p>
          <h2 className="text-3xl md:text-4xl font-black tracking-tight mb-10">
            Your <span className="gold-text">Man to Father</span> Plan
          </h2>

          <div className="w-full max-w-md space-y-4">
            <div className="card-dark rounded-xl p-5 text-left">
              <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1">Your Commitment</p>
              <p className="text-xl font-black gold-text">{startCommitment}</p>
            </div>
            <div className="card-dark rounded-xl p-5 text-left">
              <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1">Recommended Program</p>
              <p className="text-xl font-black gold-text">{program}</p>
              <p className="text-sm text-muted-foreground mt-1">{info.description}</p>
            </div>
            <div className="card-dark rounded-xl p-5 text-left">
              <p className="text-xs font-bold tracking-widest uppercase text-muted-foreground mb-1">Workout Schedule</p>
              <p className="text-lg font-bold text-foreground">5–6 days per week</p>
              <p className="text-sm text-muted-foreground">45–60 minutes per workout</p>
            </div>
          </div>

          <p className="text-muted-foreground text-sm max-w-md mt-6 leading-relaxed">
            This program is designed specifically for fathers balancing work, family, and fitness.
          </p>
        </section>

        {/* 12-Week Timeline */}
        <section className="px-6 py-16 border-t border-border">
          <div className="max-w-md mx-auto">
            <h3 className="text-2xl md:text-3xl font-black text-center mb-10">
              What Happens Over the <span className="gold-text">Next 12 Weeks</span>
            </h3>
            <div className="relative pl-8 space-y-8">
              <div className="absolute left-3 top-2 bottom-2 w-0.5 bg-border" />
              {MILESTONES.map((m, i) => (
                <div key={i} className="relative">
                  <div className="absolute -left-5 top-1 w-4 h-4 rounded-full bg-primary border-2 border-background" />
                  <p className="text-xs font-bold tracking-widest uppercase text-primary mb-1">{m.weeks}</p>
                  <p className="text-foreground font-medium text-lg">{m.text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Strong Father Standards */}
        <section className="px-6 py-16 border-t border-border">
          <div className="max-w-md mx-auto text-center">
            <h3 className="text-2xl md:text-3xl font-black mb-3">
              <span className="gold-text">Strong Father</span> Standards
            </h3>
            <p className="text-muted-foreground mb-8 text-sm">
              The Man to Father system helps you work toward these benchmarks over time.
            </p>
            <div className="grid grid-cols-3 gap-3">
              {STANDARDS.map((s, i) => (
                <div key={i} className="card-dark rounded-xl p-4 flex flex-col items-center gap-2">
                  <span className="text-2xl">{s.icon}</span>
                  <p className="text-sm font-bold text-foreground">{s.metric}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Continue to offer */}
        <section className="px-6 py-16 border-t border-border">
          <div className="max-w-lg mx-auto text-center">
            <Button
              size="lg"
              onClick={() => goTo("offer")}
              className="text-lg px-10 py-6 font-bold rounded-xl gold-gradient text-primary-foreground"
            >
              Start My Transformation <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
            <button
              onClick={() => goTo("results")}
              className="mt-4 text-muted-foreground text-sm flex items-center gap-1 hover:text-foreground transition-colors mx-auto"
            >
              ← Back
            </button>
          </div>
        </section>
      </div>
    );
  }

  /* ───── STEP: FREE TRIAL OFFER ───── */
  return (
    <div ref={scrollContainerRef} className="min-h-screen bg-background text-foreground overflow-y-auto max-h-screen">
      <section className="px-6 py-20">
        <div className="max-w-lg mx-auto text-center">
          <h2 className="text-2xl md:text-4xl font-black mb-3">
            Start Your <span className="gold-text">7-Day Free Trial</span>
          </h2>
          <p className="text-muted-foreground mb-10">
            Your recommended program — <span className="font-semibold text-foreground">{program}</span> — will automatically load when you start.
          </p>

          <div className="grid gap-4 md:grid-cols-2 mb-8">
            <Link to="/?subscribe=true&plan=training" className="block">
              <div className="card-dark rounded-xl p-6 hover:border-primary transition-all">
                <p className="font-black text-lg mb-1">Training Only</p>
                <p className="text-2xl font-black gold-text">
                  $29<span className="text-sm text-muted-foreground font-medium">/mo</span>
                </p>
              </div>
            </Link>
            <Link to="/?subscribe=true&plan=total" className="block">
              <div className="rounded-xl p-6 border-2 border-primary bg-primary/5 glow-gold relative">
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-[10px] font-bold tracking-widest uppercase px-3 py-1 rounded-full">
                  Most Popular
                </span>
                <p className="font-black text-lg mb-1">Total Transformation</p>
                <p className="text-2xl font-black gold-text">
                  $49<span className="text-sm text-muted-foreground font-medium">/mo</span>
                </p>
              </div>
            </Link>
          </div>

          <Link to="/?subscribe=true">
            <Button
              size="lg"
              className="text-lg px-10 py-6 font-bold rounded-xl gold-gradient text-primary-foreground w-full md:w-auto"
            >
              Start Free Trial <ChevronRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-6 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> 7-day free trial</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> Cancel anytime</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4 text-primary" /> Workouts under 60 min</span>
          </div>
        </div>
      </section>

      {!isAtBottom && (
        <div className="flex flex-col items-center gap-2 py-8 text-muted-foreground">
          <p className="text-xs">Scroll to see more</p>
          <ArrowDown className="w-4 h-4 animate-bounce" />
        </div>
      )}

      <section className="px-6 py-20 border-t border-border">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-2xl md:text-3xl font-black leading-snug">
            Your kids are watching how you live.
          </p>
          <p className="text-2xl md:text-3xl font-black gold-text mt-2 leading-snug">
            Become the strong father they remember.
          </p>
        </div>
      </section>
    </div>
  );
}
