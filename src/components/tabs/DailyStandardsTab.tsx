import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Flame, Trophy, CheckCircle2, Circle, TrendingUp, Plus, Trash2, Settings, X } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface StandardDef {
  id: string;
  key: string;
  label: string;
  emoji: string;
  is_global: boolean;
  target_user_id: string | null;
  is_active: boolean;
  sort_order: number;
  created_by: string;
}

interface DailyEntry {
  id?: string;
  standard_date: string;
  completions: Record<string, boolean>;
}

const FALLBACK_STANDARDS: StandardDef[] = [
  { id: "f1", key: "wake_on_time", label: "Wake On Time", emoji: "⏰", is_global: true, target_user_id: null, is_active: true, sort_order: 0, created_by: "" },
  { id: "f2", key: "workout_completed", label: "Train", emoji: "🏋️", is_global: true, target_user_id: null, is_active: true, sort_order: 1, created_by: "" },
  { id: "f3", key: "protein_hit", label: "Hit Protein", emoji: "🥩", is_global: true, target_user_id: null, is_active: true, sort_order: 2, created_by: "" },
  { id: "f4", key: "steps_hit", label: "Hit Steps", emoji: "🚶", is_global: true, target_user_id: null, is_active: true, sort_order: 3, created_by: "" },
  { id: "f5", key: "scripture_read", label: "Read / Pray", emoji: "📖", is_global: true, target_user_id: null, is_active: true, sort_order: 4, created_by: "" },
  { id: "f6", key: "family_time", label: "Family Time", emoji: "👨‍👧‍👦", is_global: true, target_user_id: null, is_active: true, sort_order: 5, created_by: "" },
  { id: "f7", key: "no_phone_at_dinner", label: "No Phone at Dinner", emoji: "📵", is_global: true, target_user_id: null, is_active: true, sort_order: 6, created_by: "" },
  { id: "f8", key: "hydration_hit", label: "Hydration", emoji: "💧", is_global: true, target_user_id: null, is_active: true, sort_order: 7, created_by: "" },
];

const todayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export function DailyStandardsTab() {
  const { user } = useAuth();
  const [standards, setStandards] = useState<StandardDef[]>([]);
  const [today, setToday] = useState<DailyEntry | null>(null);
  const [history, setHistory] = useState<DailyEntry[]>([]);
  const [saving, setSaving] = useState(false);
  const [showCustomize, setShowCustomize] = useState(false);
  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("✅");
  const [currentDate, setCurrentDate] = useState(todayStr());
  const [disabledGlobals, setDisabledGlobals] = useState<Set<string>>(new Set());

  // Re-check the date every 30 seconds; reload if it rolled over midnight
  useEffect(() => {
    const interval = setInterval(() => {
      const now = todayStr();
      if (now !== currentDate) {
        setCurrentDate(now);
        setToday(null);
        loadData();
      }
    }, 30_000);
    return () => clearInterval(interval);
  }, [currentDate]);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const [{ data: stdData }, { data: todayData }, { data: histData }] = await Promise.all([
      supabase
        .from("standard_definitions")
        .select("*")
        .or(`and(is_global.eq.true,target_user_id.is.null),target_user_id.eq.${user.id},created_by.eq.${user.id}`)
        .eq("is_active", true)
        .order("sort_order"),
      supabase
        .from("daily_standards")
        .select("id, standard_date, completions")
        .eq("user_id", user.id)
        .eq("standard_date", todayStr())
        .maybeSingle(),
      supabase
        .from("daily_standards")
        .select("id, standard_date, completions")
        .eq("user_id", user.id)
        .order("standard_date", { ascending: false })
        .limit(90),
    ]);

    const activeStandards = (stdData && stdData.length > 0) ? (stdData as any[]) : FALLBACK_STANDARDS;
    setStandards(activeStandards);

    // D4: load per-user global-standard prefs (rows only exist when toggled)
    const { data: prefData } = await (supabase as any)
      .from("user_standard_prefs")
      .select("standard_definition_id, enabled")
      .eq("user_id", user.id);
    if (prefData) {
      setDisabledGlobals(
        new Set((prefData as any[]).filter((r) => r.enabled === false).map((r) => r.standard_definition_id)),
      );
    }

    if (todayData) {
      setToday({
        id: (todayData as any).id,
        standard_date: (todayData as any).standard_date,
        completions: (todayData as any).completions || {},
      });
    } else {
      setToday({ standard_date: todayStr(), completions: {} });
    }

    if (histData) {
      setHistory(
        (histData as any[]).map((h) => ({
          id: h.id,
          standard_date: h.standard_date,
          completions: h.completions || {},
        }))
      );
    }
  };

  const activeStandards = useMemo(
    () => standards.filter((s) => s.is_active && !disabledGlobals.has(s.id)),
    [standards, disabledGlobals]
  );

  const toggleStandard = async (key: string) => {
    if (!user || !today || saving) return;
    setSaving(true);
    const newCompletions = { ...today.completions, [key]: !today.completions[key] };
    setToday({ ...today, completions: newCompletions });

    const payload = {
      user_id: user.id,
      standard_date: todayStr(),
      completions: newCompletions,
      // Also update legacy columns for backward compat
      wake_on_time: !!newCompletions.wake_on_time,
      workout_completed: !!newCompletions.workout_completed,
      protein_hit: !!newCompletions.protein_hit,
      steps_hit: !!newCompletions.steps_hit,
      scripture_read: !!newCompletions.scripture_read,
      family_time: !!newCompletions.family_time,
      no_phone_at_dinner: !!newCompletions.no_phone_at_dinner,
      hydration_hit: !!newCompletions.hydration_hit,
    };

    if (today.id) {
      await supabase.from("daily_standards").update(payload as any).eq("id", today.id);
    } else {
      const { data } = await supabase.from("daily_standards").insert(payload as any).select("id").single();
      if (data) setToday({ ...today, id: (data as any).id, completions: newCompletions });
    }
    setSaving(false);
  };

  const addPersonalStandard = async () => {
    if (!user || !newLabel.trim()) return;
    const key = "custom_" + newLabel.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const { error } = await supabase.from("standard_definitions").insert({
      key,
      label: newLabel.trim(),
      emoji: newEmoji || "✅",
      is_global: false,
      created_by: user.id,
      target_user_id: user.id,
      sort_order: standards.length,
    } as any);
    if (error) {
      toast({ title: "Failed to add", variant: "destructive" });
    } else {
      setNewLabel("");
      setNewEmoji("✅");
      loadData();
      toast({ title: `Added "${newLabel.trim()}"` });
    }
  };

  const removePersonalStandard = async (id: string) => {
    await supabase.from("standard_definitions").delete().eq("id", id);
    loadData();
    toast({ title: "Standard removed" });
  };

  // D4: toggle a GLOBAL standard on/off for this user only
  const toggleGlobalStandard = async (definitionId: string, enabled: boolean) => {
    if (!user) return;
    setDisabledGlobals((prev) => {
      const next = new Set(prev);
      if (enabled) next.delete(definitionId);
      else next.add(definitionId);
      return next;
    });
    await (supabase as any).from("user_standard_prefs").upsert(
      { user_id: user.id, standard_definition_id: definitionId, enabled, updated_at: new Date().toISOString() },
      { onConflict: "user_id,standard_definition_id" },
    );
  };

  // Calculations
  const todayScore = useMemo(() => {
    if (!today) return 0;
    return activeStandards.filter((s) => today.completions[s.key]).length;
  }, [today, activeStandards]);

  const todayPct = activeStandards.length > 0 ? Math.round((todayScore / activeStandards.length) * 100) : 0;

  const streak = useMemo(() => {
    if (history.length === 0 || activeStandards.length === 0) return 0;
    let count = 0;
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const threshold = Math.max(1, Math.floor(activeStandards.length * 0.75));

    for (let i = 0; i < history.length; i++) {
      const expected = new Date(now);
      expected.setDate(expected.getDate() - i);
      const expStr = expected.toISOString().split("T")[0];
      const entry = history.find((h) => h.standard_date === expStr);
      if (!entry) break;
      const dayScore = activeStandards.filter((s) => entry.completions[s.key]).length;
      if (dayScore >= threshold) count++;
      else break;
    }
    return count;
  }, [history, activeStandards]);

  const weeklyScore = useMemo(() => {
    const now = new Date();
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const cutoff = weekAgo.toISOString().split("T")[0];
    const weekEntries = history.filter((h) => h.standard_date >= cutoff);
    if (weekEntries.length === 0 || activeStandards.length === 0) return 0;
    const totalPossible = weekEntries.length * activeStandards.length;
    const totalHit = weekEntries.reduce(
      (sum, entry) => sum + activeStandards.filter((s) => entry.completions[s.key]).length,
      0
    );
    return Math.round((totalHit / totalPossible) * 100);
  }, [history, activeStandards]);

  const bestStreak = useMemo(() => {
    if (history.length === 0 || activeStandards.length === 0) return 0;
    const sorted = [...history].sort((a, b) => a.standard_date.localeCompare(b.standard_date));
    const threshold = Math.max(1, Math.floor(activeStandards.length * 0.75));
    let best = 0;
    let current = 0;
    for (const entry of sorted) {
      const dayScore = activeStandards.filter((s) => entry.completions[s.key]).length;
      if (dayScore >= threshold) {
        current++;
        best = Math.max(best, current);
      } else {
        current = 0;
      }
    }
    return best;
  }, [history, activeStandards]);

  const last7Days = useMemo(() => {
    const days: { date: string; label: string; score: number }[] = [];
    const now = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0];
      const entry = history.find((h) => h.standard_date === dateStr);
      const score = entry ? activeStandards.filter((s) => entry.completions[s.key]).length : 0;
      days.push({
        date: dateStr,
        label: d.toLocaleDateString("en-US", { weekday: "short" }).charAt(0),
        score,
      });
    }
    return days;
  }, [history, activeStandards]);

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, []);

  if (!today) return null;

  return (
    <div className="px-4 pt-6 pb-24 space-y-5">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
            {greeting}
          </p>
          <h1 className="text-3xl font-black tracking-tight text-foreground mt-1">
            Daily Standards
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {new Date().toLocaleDateString("en-US", {
              weekday: "long",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <button
          onClick={() => setShowCustomize(!showCustomize)}
          className="p-2 rounded-xl bg-secondary text-muted-foreground hover:text-foreground transition-colors"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Customize Panel */}
      {showCustomize && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-foreground">Customize Your Standards</p>
            <button onClick={() => setShowCustomize(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Global standards - toggle on/off for yourself (D4) */}
          {standards.filter((s) => s.is_global && !s.id.startsWith("f")).length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Core Standards</p>
              {standards
                .filter((s) => s.is_global && !s.id.startsWith("f"))
                .map((s) => (
                  <div key={s.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-secondary/50">
                    <span className="text-lg">{s.emoji}</span>
                    <span className="text-sm font-semibold text-foreground flex-1">{s.label}</span>
                    <Switch
                      checked={!disabledGlobals.has(s.id)}
                      onCheckedChange={(checked) => toggleGlobalStandard(s.id, checked)}
                    />
                  </div>
                ))}
            </div>
          )}

          {/* Personal standards (user-created) */}
          {standards
            .filter((s) => s.created_by === user?.id && !s.is_global)
            .map((s) => (
              <div key={s.id} className="flex items-center gap-3 px-3 py-2 rounded-xl bg-secondary/50">
                <span className="text-lg">{s.emoji}</span>
                <span className="text-sm font-semibold text-foreground flex-1">{s.label}</span>
                <button
                  onClick={() => removePersonalStandard(s.id)}
                  className="text-destructive/60 hover:text-destructive"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}

          {/* Add new */}
          <div className="flex gap-2">
            <input
              type="text"
              value={newEmoji}
              onChange={(e) => setNewEmoji(e.target.value)}
              className="w-12 bg-secondary border border-border rounded-xl px-2 py-2 text-center text-lg focus:outline-none focus:border-primary"
              maxLength={2}
            />
            <input
              type="text"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="Add personal standard..."
              className="flex-1 bg-secondary border border-border rounded-xl px-3 py-2 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
            />
            <button
              onClick={addPersonalStandard}
              disabled={!newLabel.trim()}
              className="px-3 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-sm disabled:opacity-50"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[10px] text-muted-foreground">
            Core standards are on by default. Switch off any that do not fit your build, or add your own below.
          </p>
        </div>
      )}

      {/* Score Ring */}
      <div className="bg-card border border-border rounded-2xl p-5">
        <div className="flex items-center gap-5">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 -rotate-90" viewBox="0 0 80 80">
              <circle cx="40" cy="40" r="34" fill="none" stroke="hsl(var(--secondary))" strokeWidth="6" />
              <circle
                cx="40" cy="40" r="34" fill="none"
                stroke="hsl(var(--primary))" strokeWidth="6" strokeLinecap="round"
                strokeDasharray={`${(todayPct / 100) * 213.6} 213.6`}
                className="transition-all duration-500"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-xl font-black text-foreground">
                {todayScore}/{activeStandards.length}
              </span>
            </div>
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Flame className="w-4 h-4 text-primary" />
              <span className="text-sm font-bold text-foreground">{streak} day streak</span>
            </div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">{weeklyScore}% this week</span>
            </div>
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Best: {bestStreak} days</span>
            </div>
          </div>
        </div>

        {/* Mini week view */}
        <div className="flex justify-between mt-4 pt-3 border-t border-border">
          {last7Days.map((day) => (
            <div key={day.date} className="flex flex-col items-center gap-1">
              <span className="text-[10px] font-bold text-muted-foreground uppercase">{day.label}</span>
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  activeStandards.length > 0 && day.score >= Math.floor(activeStandards.length * 0.75)
                    ? "bg-primary text-primary-foreground"
                    : day.score >= Math.floor(activeStandards.length * 0.5)
                    ? "bg-primary/30 text-foreground"
                    : day.score > 0
                    ? "bg-secondary text-muted-foreground"
                    : "bg-secondary/50 text-muted-foreground/50"
                }`}
              >
                {day.score}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Standards Checklist */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-1">
        <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-3 px-1">
          Today's Non-Negotiables
        </p>
        {activeStandards.map((standard) => {
          const checked = !!today.completions[standard.key];
          return (
            <button
              key={standard.key}
              onClick={() => toggleStandard(standard.key)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                checked ? "bg-primary/10" : "hover:bg-secondary/50"
              }`}
            >
              {checked ? (
                <CheckCircle2 className="w-6 h-6 text-primary shrink-0" />
              ) : (
                <Circle className="w-6 h-6 text-muted-foreground/40 shrink-0" />
              )}
              <span className="text-lg mr-1">{standard.emoji}</span>
              <span className={`text-sm font-semibold ${checked ? "text-foreground" : "text-muted-foreground"}`}>
                {standard.label}
              </span>
            </button>
          );
        })}
      </div>

      {/* Weekly Scorecard */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Trophy className="w-4 h-4 text-primary" />
          </div>
          <p className="text-sm font-bold text-foreground">Weekly Scorecard</p>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {activeStandards.map((standard) => {
            const weekHits = last7Days.filter((d) => {
              const entry = history.find((h) => h.standard_date === d.date);
              return entry ? !!entry.completions[standard.key] : false;
            }).length;
            return (
              <div key={standard.key} className="bg-secondary/50 rounded-xl p-2 text-center space-y-0.5">
                <span className="text-lg">{standard.emoji}</span>
                <p className="text-lg font-black text-foreground">
                  {weekHits}<span className="text-xs text-muted-foreground font-normal">/7</span>
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
