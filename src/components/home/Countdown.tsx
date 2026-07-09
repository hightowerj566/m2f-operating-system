import { useMemo } from "react";
import { Baby } from "lucide-react";

const MESSAGES = [
  "You're on track.",
  "One day closer.",
  "Keep showing up.",
  "Every small step matters.",
  "Your future family is worth today's effort.",
  "Progress beats perfection.",
  "You're becoming the father your family deserves.",
  "Small actions. Big impact.",
  "One mission at a time.",
];

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const PREGNANCY_DAYS = 280;

function todaysMessage(): string {
  const dayIndex = Math.floor(Date.now() / MS_PER_DAY) % MESSAGES.length;
  return MESSAGES[dayIndex];
}

function formatCountUp(arrivedAt: string | Date): { label: string; sub: string } {
  const start = typeof arrivedAt === "string" ? new Date(arrivedAt) : arrivedAt;
  const days = Math.floor((Date.now() - start.getTime()) / MS_PER_DAY) + 1;

  if (days < 7) {
    return { label: `Day ${days} as Dad`, sub: "Welcome to fatherhood." };
  }
  if (days < 30) {
    const weeks = Math.floor(days / 7);
    return { label: `Week ${weeks} of Fatherhood`, sub: "You're finding your rhythm." };
  }
  const months = Math.floor(days / 30);
  return { label: `Month ${months} as Dad`, sub: "The new chapter is well underway." };
}

function pregnancyProgress(daysRemaining: number): number {
  return Math.max(0, Math.min(1, 1 - daysRemaining / PREGNANCY_DAYS));
}

interface CountdownProps {
  days: number | null;
  arrived: boolean;
  babyArrivedAt?: string | Date | null;
  week: number | null;
  babyName?: string | null;
  firstName?: string;
}

export function Countdown({ days, arrived, babyArrivedAt, week, babyName, firstName }: CountdownProps) {
  const message = useMemo(() => todaysMessage(), []);

  // ── After birth: count up, not down ──
  if (arrived && babyArrivedAt) {
    const { label, sub } = formatCountUp(babyArrivedAt);
    return (
      <div className="flex items-start gap-5">
        <div className="relative shrink-0 w-16 h-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center animate-gentle-pulse">
          <Baby className="w-7 h-7 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="font-black tracking-tight leading-[0.9] text-foreground text-[48px]">
            {label}
          </h1>
          <p className="text-muted-foreground mt-2 text-[15px] leading-snug">
            {babyName ? `${babyName} is here. ${sub}` : sub}
          </p>
          <p className="text-foreground/70 text-sm mt-2">{message}</p>
        </div>
      </div>
    );
  }

  // ── No due date set ──
  if (days == null) {
    return (
      <div>
        <h1 className="font-black tracking-tight leading-[0.9] text-foreground text-[64px]">—</h1>
        <p className="text-muted-foreground mt-3 text-[15px] leading-snug">
          Set your due date to begin the countdown.
        </p>
        <p className="text-foreground/70 text-sm mt-2">{message}</p>
      </div>
    );
  }

  const weeksLeft = Math.floor(days / 7);
  const extraDaysLeft = days % 7;
  const progress = pregnancyProgress(days);
  const isBirthWeek = days <= 7;
  const isDaysOnly = days < 56;
  const isWeeksAndDays = days >= 56 && days <= 140;

  // ── Birth week: emotional emphasis, not stress ──
  if (isBirthWeek) {
    return (
      <div className="flex items-start gap-5">
        <CountdownRing progress={progress} pulse />
        <div className="flex-1 min-w-0">
          <h1 className="font-black tracking-tight leading-[0.95] text-foreground text-[40px]">
            {days === 0 ? "Today Changes Everything" : "This Week Changes Everything"}
          </h1>
          <p className="text-muted-foreground mt-2 text-[15px] leading-snug">
            {days === 0
              ? `Pregnancy Week ${week ?? "—"} · ${babyName ? `${babyName} is on the way.` : "Baby is on the way."}`
              : `${days} day${days === 1 ? "" : "s"} until fatherhood · Pregnancy Week ${week ?? "—"}`}
          </p>
          <p className="text-foreground/70 text-sm mt-2">{message}</p>
        </div>
      </div>
    );
  }

  // ── Fewer than 8 weeks: days only ──
  if (isDaysOnly) {
    return (
      <div>
        <h1 className="font-black tracking-tight leading-[0.9] text-foreground text-[64px]">
          {days} Day{days === 1 ? "" : "s"} Until Fatherhood
        </h1>
        <p className="text-muted-foreground mt-2 text-[15px] leading-snug">Pregnancy Week {week ?? "—"}</p>
        <p className="text-foreground/70 text-sm mt-2">{message}</p>
      </div>
    );
  }

  // ── 8–20 weeks: weeks + days ──
  if (isWeeksAndDays) {
    return (
      <div>
        <div className="flex items-baseline gap-2 flex-wrap">
          <span className="font-black tracking-tight leading-none text-foreground text-[64px] tabular-nums">
            {weeksLeft}
          </span>
          <span className="font-bold text-muted-foreground text-lg">weeks</span>
          {extraDaysLeft > 0 && (
            <>
              <span className="font-black tracking-tight leading-none text-foreground text-[40px] tabular-nums ml-1">
                {extraDaysLeft}
              </span>
              <span className="font-bold text-muted-foreground text-lg">days</span>
            </>
          )}
          <span className="font-bold text-muted-foreground text-lg ml-1">Until Fatherhood</span>
        </div>
        <p className="text-muted-foreground mt-2 text-[15px] leading-snug">Pregnancy Week {week ?? "—"}</p>
        <p className="text-foreground/70 text-sm mt-2">{message}</p>
      </div>
    );
  }

  // ── More than 20 weeks: weeks only ──
  return (
    <div>
      <h1 className="font-black tracking-tight leading-[0.9] text-foreground text-[64px]">
        {weeksLeft} Weeks Until Fatherhood
      </h1>
      <p className="text-muted-foreground mt-2 text-[15px] leading-snug">Pregnancy Week {week ?? "—"}</p>
      <p className="text-foreground/70 text-sm mt-2">{message}</p>
    </div>
  );
}

function CountdownRing({ progress, pulse }: { progress: number; pulse?: boolean }) {
  const size = 72;
  const stroke = 6;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const dash = Math.max(0, Math.min(c, progress * c));

  return (
    <div
      className={`relative shrink-0 ${pulse ? "animate-gentle-pulse" : ""}`}
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="hsl(var(--border))"
          strokeWidth={stroke}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="hsl(var(--primary))"
          strokeWidth={stroke}
          strokeLinecap="round"
          fill="none"
          strokeDasharray={`${dash} ${c - dash}`}
        />
      </svg>
    </div>
  );
}
