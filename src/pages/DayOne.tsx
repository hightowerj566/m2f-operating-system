// M2F OS · The Day One Playbook + The First 40 Days.
// Two tabs on one page: what to do the moment it starts, and the postpartum
// operating manual. Shown prominently in Mission Mode and Father Mode.

import { useState } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { ChevronLeft } from "lucide-react";
import { DAY_ONE_PLAYBOOK, FIRST_40_DAYS } from "@/content/fatherhood";

export default function DayOne() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"day-one" | "first-40">("day-one");

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  const steps = tab === "day-one" ? DAY_ONE_PLAYBOOK : FIRST_40_DAYS;

  return (
    <div className="min-h-dvh bg-background text-foreground max-w-md mx-auto px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <button
        onClick={() => navigate("/")}
        className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Home
      </button>

      <p className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-1">The Playbook</p>
      <h1 className="text-3xl font-black tracking-tight mb-1">
        {tab === "day-one" ? "When it starts." : "The First 40 Days."}
      </h1>
      <p className="text-muted-foreground text-sm mb-5">
        {tab === "day-one"
          ? "The exact sequence, from first contraction to first photo. Read it now so Day One runs on training, not adrenaline."
          : "Her recovery, your reps, the house, the marriage. The postpartum operating manual."}
      </p>

      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab("day-one")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
            tab === "day-one" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"
          }`}
        >
          Day One
        </button>
        <button
          onClick={() => setTab("first-40")}
          className={`flex-1 py-2.5 rounded-xl text-sm font-bold border transition-all ${
            tab === "first-40" ? "border-primary bg-primary/10 text-primary" : "border-border bg-card text-muted-foreground"
          }`}
        >
          First 40 Days
        </button>
      </div>

      <div className="space-y-3">
        {steps.map((s, i) => (
          <div key={i} className="bg-card border border-border rounded-2xl p-4 flex gap-3">
            <span className="w-7 h-7 rounded-full gold-gradient text-primary-foreground text-sm font-black flex items-center justify-center shrink-0">
              {i + 1}
            </span>
            <div>
              <p className="font-bold text-sm">{s.title}</p>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{s.detail}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground mt-6 leading-relaxed">
        General preparation guidance, not medical advice. Your OB's instructions and hospital's protocols always win.
      </p>
    </div>
  );
}
