// M2F OS · Flagship today card.
// Shows today's exact program day + type (training / recovery / rest /
// optional / birth-window / pre-program) for the day-based flagship engine.

import { useEffect, useState } from "react";
import { Dumbbell, Zap, Coffee, Wind, Moon, HeartPulse, Baby, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getFlagshipJourneyDay } from "@/lib/training/getFlagshipJourneyDay";
import { getFlagshipWorkout } from "@/lib/training/flagshipJourney";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

const ICONS: Record<string, typeof Dumbbell> = {
  training: Dumbbell,
  "active-recovery": HeartPulse,
  mobility: Wind,
  rest: Moon,
  "optional-training": Zap,
  "birth-window": Baby,
  "post-birth-recovery": Coffee,
  transition: Calendar,
};

export function FlagshipTodayCard({
  userId,
  onStart,
}: {
  userId: string;
  onStart?: (version: "full" | "express" | "minimum") => void;
}) {
  const [state, setState] = useState<{
    dueDate: string | null;
    babyArrivedAt: string | null;
  } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await db
        .from("profiles")
        .select("due_date, baby_arrived_at")
        .eq("user_id", userId)
        .maybeSingle();
      if (cancelled) return;
      setState({
        dueDate: data?.due_date ?? null,
        babyArrivedAt: data?.baby_arrived_at ?? null,
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (!state) return null;

  const resolved = getFlagshipJourneyDay({
    dueDate: state.dueDate,
    babyArrivedAt: state.babyArrivedAt,
    coachAssignment: null,
  });

  if (resolved.status === "needs-due-date") {
    return (
      <Card>
        <Header title="Set your due date" tag="M2F Flagship" />
        <p className="text-sm text-muted-foreground">
          Add your due date so the app can drop you into the correct day of the M2F Guided Journey.
        </p>
      </Card>
    );
  }

  if (resolved.status === "pre-program") {
    return (
      <Card>
        <Header
          title={`Journey starts in ${resolved.daysUntilProgramStart} day${
            resolved.daysUntilProgramStart === 1 ? "" : "s"
          }`}
          tag="Pre-program"
        />
        <p className="text-sm text-muted-foreground mb-1">
          Program Day 1 unlocks {resolved.scheduledStartDate}. Use this window for baseline assessment, equipment, and nutrition setup.
        </p>
      </Card>
    );
  }

  if (resolved.status === "post-due-date") {
    return (
      <Card accent="birth">
        <Header title="Birth Window" tag={`${resolved.daysPastDueDate} day(s) past due`} />
        <p className="text-sm text-muted-foreground">
          Training is optional. Stay available for your family. Walk, mobilize, or rest — all count.
        </p>
      </Card>
    );
  }

  if (resolved.status === "post-birth") {
    const day = resolved.day;
    const Icon = ICONS[day?.dayType ?? "training"] ?? Dumbbell;
    return (
      <Card>
        <Header
          title={day?.title ?? "Post-birth Day"}
          tag={`Post-birth Day ${resolved.postpartumDay} · ${day?.stageName ?? ""}`}
        />
        {day?.objective && <p className="text-sm text-muted-foreground mb-3">{day.objective}</p>}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon className="w-4 h-4" />
          <span className="uppercase tracking-wider font-bold">{day?.dayType}</span>
          {day && !day.isRequired && (
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-bold">Optional</span>
          )}
        </div>
      </Card>
    );
  }

  // active
  const { day, programDay, daysUntilDueDate, pregnancyWeek } = resolved;
  const Icon = ICONS[day.dayType] ?? Dumbbell;
  const workout = day.workoutId ? getFlagshipWorkout(day.workoutId) : null;

  return (
    <Card>
      <div className="flex items-baseline justify-between mb-3">
        <div>
          <p className="text-[10px] font-bold tracking-[0.24em] uppercase text-muted-foreground">Program Day</p>
          <p className="text-3xl font-black leading-none">
            {programDay}
            <span className="text-lg text-muted-foreground font-bold"> / 252</span>
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] font-bold tracking-[0.24em] uppercase text-muted-foreground">Until Due</p>
          <p className="text-3xl font-black leading-none text-primary">{daysUntilDueDate}</p>
          <p className="text-[10px] text-muted-foreground">days · week {pregnancyWeek}</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-secondary/40 p-3 mb-3">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-4 h-4 text-primary" />
          <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-muted-foreground">
            {day.dayType.replace("-", " ")}
          </span>
          {!day.isRequired && (
            <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-bold">Optional</span>
          )}
        </div>
        <p className="text-base font-black">{day.title}</p>
        {day.objective && <p className="text-xs text-muted-foreground mt-1">{day.objective}</p>}
        {day.activities && day.activities.length > 0 && (
          <ul className="mt-2 space-y-0.5">
            {day.activities.map((a, i) => (
              <li key={i} className="text-xs text-muted-foreground">
                · {a.type} — {a.target}
              </li>
            ))}
          </ul>
        )}
      </div>

      {day.dayType === "training" && workout ? (
        <div className="grid grid-cols-3 gap-2">
          {(["full", "express", "minimum"] as const).map((v) => (
            <button
              key={v}
              onClick={() => onStart?.(v)}
              className="h-10 rounded-xl bg-primary text-primary-foreground font-black text-xs uppercase tracking-wider"
            >
              {v}
            </button>
          ))}
        </div>
      ) : (
        <button
          onClick={() => onStart?.("full")}
          className="w-full h-10 rounded-xl border border-border font-bold text-xs uppercase tracking-wider"
        >
          Mark {day.dayType.replace("-", " ")} complete
        </button>
      )}
    </Card>
  );
}

function Card({
  children,
  accent,
}: {
  children: React.ReactNode;
  accent?: "birth";
}) {
  return (
    <div
      className={`mx-5 rounded-2xl border p-5 mb-4 ${
        accent === "birth"
          ? "border-primary/60 bg-primary/10"
          : "border-border bg-card"
      }`}
    >
      {children}
    </div>
  );
}

function Header({ title, tag }: { title: string; tag: string }) {
  return (
    <div className="mb-2">
      <p className="text-[10px] font-bold tracking-[0.28em] uppercase text-muted-foreground mb-1">{tag}</p>
      <h2 className="text-xl font-black">{title}</h2>
    </div>
  );
}
