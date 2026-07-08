import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const SCHEDULES_LEGACY = [
  {
    days: 5,
    layout: [
      { label: "Upper Strength + Power", active: true },
      { label: "Lower Strength + Power", active: true },
      { label: "Conditioning + Core", active: true },
      { label: "Upper Hypertrophy", active: true },
      { label: "Lower Hypertrophy + Conditioning", active: true },
      { label: "Rest", active: false },
      { label: "Rest", active: false },
    ],
  },
  {
    days: 6,
    layout: [
      { label: "Upper Strength + Power", active: true },
      { label: "Lower Strength + Power", active: true },
      { label: "Conditioning + Core", active: true },
      { label: "Upper Hypertrophy", active: true },
      { label: "Lower Hypertrophy", active: true },
      { label: "Athletic Conditioning", active: true },
      { label: "Rest", active: false },
    ],
  },
];

const SCHEDULES_STANDARD = [
  {
    days: 4,
    layout: [
      { label: "Squat", active: true },
      { label: "Push & Pull", active: true },
      { label: "Rest", active: false },
      { label: "Hinge", active: true },
      { label: "Upper Hyp", active: true },
      { label: "Rest", active: false },
      { label: "Rest", active: false },
    ],
  },
  {
    days: 6,
    layout: [
      { label: "Squat", active: true },
      { label: "Push & Pull", active: true },
      { label: "Zone 2 + Core", active: true },
      { label: "Upper Hyp", active: true },
      { label: "Hinge Hyp", active: true },
      { label: "Conditioning", active: true },
      { label: "Rest", active: false },
    ],
  },
];

const SCHEDULES_HOME = [
  {
    days: 4,
    layout: [
      { label: "Squat", active: true },
      { label: "Push & Pull", active: true },
      { label: "Rest", active: false },
      { label: "Hinge", active: true },
      { label: "Upper Hyp", active: true },
      { label: "Rest", active: false },
      { label: "Rest", active: false },
    ],
  },
  {
    days: 6,
    layout: [
      { label: "Squat", active: true },
      { label: "Push & Pull", active: true },
      { label: "Zone 2 + Core", active: true },
      { label: "Upper Hyp", active: true },
      { label: "Hinge Hyp", active: true },
      { label: "Conditioning", active: true },
      { label: "Rest", active: false },
    ],
  },
];

const SCHEDULES_EVERYDAY = [
  {
    days: 4,
    layout: [
      { label: "Full Body A", active: true },
      { label: "Full Body B", active: true },
      { label: "Rest", active: false },
      { label: "Athletic + Arms", active: true },
      { label: "Hypertrophy", active: true },
      { label: "Rest", active: false },
      { label: "Rest", active: false },
    ],
  },
  {
    days: 6,
    layout: [
      { label: "Upper Str", active: true },
      { label: "Speed + Core", active: true },
      { label: "Lower Str", active: true },
      { label: "Athletic", active: true },
      { label: "Hypertrophy", active: true },
      { label: "Arms + Mob", active: true },
      { label: "Rest", active: false },
    ],
  },
];

const DAY_LABELS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

// The Standard program IDs
const STANDARD_6DAY_ID = "0e98e26f-57be-4096-afc0-65952b8fd24e";
const STANDARD_4DAY_ID = "3f4527b4-57de-4902-91fa-b0cc429c7354";

// The Home Standard program IDs
const HOME_6DAY_ID = "ef77309c-e443-4c4a-8ff9-f42d6dcb71a8";
const HOME_4DAY_ID = "d12d4d7e-4d4f-4665-9ab4-3fbca359c21d";

// Everyday Dad program IDs
const EVERYDAY_6DAY_ID = "95864305-5e82-4de8-a03d-34fa555cfd01";
const EVERYDAY_4DAY_ID = "98fc8219-9d00-4334-86ab-abc2fdfd1d58";

const ELIGIBLE_LEGACY = ["M2F Perform 2.0", "M2F Rebuild 2.0"];
const STANDARD_NAMES = ["The Standard — M2F Perform", "The Standard — 4 Day"];
const HOME_NAMES = ["The Home Standard (6-Day)", "The Home Standard (4-Day)"];
const EVERYDAY_NAMES = ["M2F Everyday Dad", "M2F Everyday Dad (4-Day)"];

interface Props {
  userId: string;
  programName?: string | null;
  programId?: string | null;
  onChange?: (days: number) => void;
  onProgramSwitch?: (newProgramId: string, newTotalDays: number) => void;
}

export function TrainingScheduleSelector({ userId, programName, programId, onChange, onProgramSwitch }: Props) {
  const [selected, setSelected] = useState(6);
  const [loaded, setLoaded] = useState(false);

  const isStandard = programName ? STANDARD_NAMES.includes(programName) : false;
  const isHome = programName ? HOME_NAMES.includes(programName) : false;
  const isEveryday = programName ? EVERYDAY_NAMES.includes(programName) : false;
  const isLegacy = programName ? ELIGIBLE_LEGACY.includes(programName) : false;
  const hasSwitcher = isStandard || isHome || isEveryday;

  useEffect(() => {
    if (hasSwitcher) {
      if (programId === STANDARD_4DAY_ID || programId === HOME_4DAY_ID || programId === EVERYDAY_4DAY_ID) {
        setSelected(4);
      } else {
        setSelected(6);
      }
      setLoaded(true);
    } else {
      supabase
        .from("profiles")
        .select("training_days_per_week")
        .eq("user_id", userId)
        .single()
        .then(({ data }) => {
          if (data?.training_days_per_week && [5, 6].includes(data.training_days_per_week)) {
            setSelected(data.training_days_per_week);
          }
          setLoaded(true);
        });
    }
  }, [userId, programId, hasSwitcher]);

  const handleSelectLegacy = async (days: number) => {
    setSelected(days);
    onChange?.(days);
    await supabase
      .from("profiles")
      .update({ training_days_per_week: days })
      .eq("user_id", userId);
  };

  const handleSelectVariant = async (days: number) => {
    setSelected(days);
    let newProgramId: string;
    if (isEveryday) {
      newProgramId = days === 4 ? EVERYDAY_4DAY_ID : EVERYDAY_6DAY_ID;
    } else if (isHome) {
      newProgramId = days === 4 ? HOME_4DAY_ID : HOME_6DAY_ID;
    } else {
      newProgramId = days === 4 ? STANDARD_4DAY_ID : STANDARD_6DAY_ID;
    }
    if (newProgramId === programId) return;

    const { data: prog } = await supabase
      .from("programs")
      .select("total_days")
      .eq("id", newProgramId)
      .single();

    const newTotal = (prog as any)?.total_days || 1;
    onProgramSwitch?.(newProgramId, newTotal);
  };

  if (!loaded) return null;
  if (!hasSwitcher && !isLegacy) return null;

  const schedules = isEveryday ? SCHEDULES_EVERYDAY : isHome ? SCHEDULES_HOME : hasSwitcher ? SCHEDULES_STANDARD : SCHEDULES_LEGACY;
  const options = hasSwitcher
    ? [{ days: 6, label: "6 Days" }, { days: 4, label: "4 Days" }]
    : [{ days: 6, label: "6 Days" }, { days: 5, label: "Express" }];

  const schedule = schedules.find((s) => s.days === selected) || schedules[1];
  const handleSelect = hasSwitcher ? handleSelectVariant : handleSelectLegacy;

  return (
    <div className="px-5 pb-4">
      <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-3">
        Training Schedule
      </p>

      {/* Tab selector */}
      <div className="flex gap-1 bg-secondary rounded-xl p-1 mb-4">
        {options.map((opt) => (
          <button
            key={opt.days}
            onClick={() => handleSelect(opt.days)}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${
              selected === opt.days
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Weekly layout */}
      <div className="grid grid-cols-7 gap-1">
        {schedule.layout.map((day, i) => (
          <div key={i} className="flex flex-col items-center gap-1">
            <span className="text-[10px] font-semibold text-muted-foreground">
              {DAY_LABELS[i]}
            </span>
            <div
              className={`w-full aspect-square rounded-lg flex items-center justify-center ${
                day.active
                  ? "bg-primary/15 border border-primary/30"
                  : "bg-secondary border border-border"
              }`}
            >
              <span
                className={`text-[10px] font-bold leading-tight text-center px-0.5 ${
                  day.active
                    ? "text-primary"
                    : "text-muted-foreground/50"
                }`}
              >
                {day.active ? "🏋️" : "—"}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-2">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-primary/15 border border-primary/30" />
          <span className="text-[10px] text-muted-foreground">Training</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-sm bg-secondary border border-border" />
          <span className="text-[10px] text-muted-foreground">Rest</span>
        </div>
      </div>
    </div>
  );
}
