import { useEffect, useState } from "react";
import { Trophy, Flame, X } from "lucide-react";

interface StreakMilestonePopupProps {
  streak: number;
  onDismiss: () => void;
}

const MILESTONES = [7, 14, 30, 60, 90, 180, 365];

const MILESTONE_DATA: Record<number, { emoji: string; title: string; message: string }> = {
  7: { emoji: "🔥", title: "1 Week Strong!", message: "You've hit 7 days of discipline. Most men quit by now. You didn't." },
  14: { emoji: "💪", title: "2 Weeks Locked In!", message: "14 days of consistency. You're building the habit that changes everything." },
  30: { emoji: "🏆", title: "30-Day Warrior!", message: "A full month of showing up. This is no longer motivation — it's identity." },
  60: { emoji: "⚡", title: "60 Days. Unstoppable.", message: "Two months of iron discipline. Your family sees a different man." },
  90: { emoji: "👑", title: "90-Day King!", message: "A full quarter of excellence. You're in the top 1% of fathers who commit." },
  180: { emoji: "🦁", title: "Half a Year. Legend.", message: "180 days of daily standards. You're building a legacy that lasts generations." },
  365: { emoji: "🏅", title: "365 Days. One Full Year.", message: "An entire year of showing up every single day. Your children will remember this." },
};

export function StreakMilestonePopup({ streak, onDismiss }: StreakMilestonePopupProps) {
  const [visible, setVisible] = useState(false);
  const [milestone, setMilestone] = useState<number | null>(null);

  useEffect(() => {
    // Check if current streak exactly matches a milestone
    const hit = MILESTONES.find((m) => streak === m);
    if (!hit) return;

    // Check if already shown this session
    const key = `streak_milestone_${hit}`;
    if (sessionStorage.getItem(key)) return;

    sessionStorage.setItem(key, "true");
    setMilestone(hit);
    setTimeout(() => setVisible(true), 500);
  }, [streak]);

  if (!visible || !milestone) return null;

  const data = MILESTONE_DATA[milestone];

  const handleDismiss = () => {
    setVisible(false);
    onDismiss();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 animate-in fade-in" onClick={handleDismiss}>
      <div
        className="bg-card border border-primary/30 rounded-3xl p-8 max-w-sm mx-4 text-center space-y-4 relative glow-gold animate-in zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <button onClick={handleDismiss} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>

        <div className="text-6xl animate-bounce">{data.emoji}</div>

        <div className="space-y-1">
          <p className="text-2xl font-black text-primary">{data.title}</p>
          <p className="text-sm text-muted-foreground leading-relaxed">{data.message}</p>
        </div>

        <div className="flex items-center justify-center gap-2 pt-2">
          <Flame className="w-5 h-5 text-primary" />
          <span className="text-3xl font-black text-foreground">{streak}</span>
          <span className="text-sm font-semibold text-muted-foreground">day streak</span>
        </div>

        <button
          onClick={handleDismiss}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
        >
          Keep Going 💪
        </button>
      </div>
    </div>
  );
}
