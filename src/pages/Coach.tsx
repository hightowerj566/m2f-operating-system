import { useState, useEffect, useCallback, memo } from "react";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Plus, Trash2, ChevronRight, ChevronLeft, Users, BookOpen, Upload, Youtube,
  Save, X, Copy, GripVertical, Dumbbell, Timer, LayoutDashboard, Weight,
  TrendingUp, UserCircle, ChevronDown, ChevronUp, Settings, ArrowLeft, Link2, Unlink,
  CreditCard, DollarSign, ClipboardList, TableProperties, ListChecks
} from "lucide-react";
import { ProgramTableView } from "@/components/workout/ProgramTableView";
import { CoachReviewCard } from "@/components/coaching/CoachReviewCard";
import { CoachStandardsManager } from "@/components/coaching/CoachStandardsManager";
import { LeadsTab } from "@/components/coaching/LeadsTab";
import { ProgramImporter } from "@/components/coaching/ProgramImporter";
import { FlagshipProgramView } from "@/components/coaching/FlagshipProgramView";
import { toast } from "@/hooks/use-toast";
import { getTierFromProductId, TIERS } from "@/lib/subscriptionTiers";

// ─── Types ───
interface ProgramExercise {
  name: string;
  detail: string;
  type: "exercise" | "rest";
  sets: number | null;
  reps: number | null;
  percentage: number | null;
  seconds: number | null;
  video_url: string | null;
  video_type: "youtube" | "upload" | null;
  group?: string;
}

interface Program {
  id: string;
  name: string;
  description: string | null;
  total_days: number;
  created_at: string;
  is_published: boolean;
  published_through_day: number | null;
}

interface ProgramDay {
  id?: string;
  day_number: number;
  label: string;
  exercises: ProgramExercise[];
}

interface ClientProfile {
  user_id: string;
  display_name: string | null;
  weight_lbs: number | null;
  goal: string | null;
  goal_rate_lb_per_week: number | null;
}

// ─── Common Exercise Templates ───
const EXERCISE_TEMPLATES = [
  // Barbell Compounds
  { name: "Back Squat", sets: 4, reps: 6 },
  { name: "Front Squat", sets: 3, reps: 6 },
  { name: "Overhead Squat", sets: 3, reps: 5 },
  { name: "Deadlift", sets: 3, reps: 5 },
  { name: "Sumo Deadlift", sets: 3, reps: 5 },
  { name: "Romanian Deadlift", sets: 3, reps: 10 },
  { name: "Bench Press", sets: 4, reps: 6 },
  { name: "Incline Bench Press", sets: 4, reps: 8 },
  { name: "Close Grip Bench Press", sets: 3, reps: 8 },
  { name: "Overhead Press", sets: 4, reps: 6 },
  { name: "Push Press", sets: 4, reps: 5 },
  { name: "Barbell Row", sets: 4, reps: 8 },
  { name: "Pendlay Row", sets: 4, reps: 6 },
  { name: "Hip Thrust", sets: 3, reps: 10 },
  // Olympic Lifts
  { name: "Clean", sets: 5, reps: 3 },
  { name: "Power Clean", sets: 5, reps: 3 },
  { name: "Hang Clean", sets: 4, reps: 3 },
  { name: "Clean & Jerk", sets: 5, reps: 2 },
  { name: "Snatch", sets: 5, reps: 2 },
  { name: "Power Snatch", sets: 5, reps: 2 },
  { name: "Hang Snatch", sets: 4, reps: 3 },
  { name: "Thruster", sets: 4, reps: 8 },
  { name: "Cluster", sets: 4, reps: 3 },
  // Bodyweight / Gymnastics
  { name: "Pull-Up", sets: 4, reps: 6 },
  { name: "Chest-to-Bar Pull-Up", sets: 4, reps: 6 },
  { name: "Muscle-Up (Bar)", sets: 3, reps: 3 },
  { name: "Muscle-Up (Ring)", sets: 3, reps: 3 },
  { name: "Dip", sets: 3, reps: 8 },
  { name: "Ring Dip", sets: 3, reps: 8 },
  { name: "Push-Up", sets: 3, reps: 15 },
  { name: "Handstand Push-Up", sets: 3, reps: 5 },
  { name: "Toes-to-Bar", sets: 3, reps: 12 },
  { name: "Knees-to-Elbow", sets: 3, reps: 15 },
  { name: "Pistol Squat", sets: 3, reps: 6 },
  { name: "Box Jump", sets: 4, reps: 5 },
  { name: "Burpee", sets: 3, reps: 10 },
  { name: "Rope Climb", sets: 3, reps: 2 },
  // Dumbbell / Accessory
  { name: "Dumbbell Bench Press", sets: 3, reps: 10 },
  { name: "Dumbbell Shoulder Press", sets: 3, reps: 10 },
  { name: "Dumbbell Row", sets: 3, reps: 10 },
  { name: "Dumbbell Lunge", sets: 3, reps: 10 },
  { name: "Dumbbell Curl", sets: 3, reps: 12 },
  { name: "Hammer Curl", sets: 3, reps: 12 },
  { name: "Lateral Raise", sets: 3, reps: 15 },
  { name: "Front Raise", sets: 3, reps: 12 },
  { name: "Rear Delt Fly", sets: 3, reps: 15 },
  { name: "Face Pull", sets: 3, reps: 15 },
  { name: "Tricep Pushdown", sets: 3, reps: 12 },
  { name: "Skull Crusher", sets: 3, reps: 10 },
  { name: "Overhead Tricep Extension", sets: 3, reps: 12 },
  { name: "Concentration Curl", sets: 3, reps: 12 },
  // Machine / Cable
  { name: "Leg Press", sets: 3, reps: 10 },
  { name: "Leg Extension", sets: 3, reps: 12 },
  { name: "Leg Curl", sets: 3, reps: 12 },
  { name: "Hack Squat", sets: 3, reps: 10 },
  { name: "Lat Pulldown", sets: 3, reps: 10 },
  { name: "Seated Cable Row", sets: 3, reps: 10 },
  { name: "Cable Fly", sets: 3, reps: 12 },
  { name: "Cable Crossover", sets: 3, reps: 12 },
  { name: "Pec Deck", sets: 3, reps: 12 },
  { name: "Calf Raise", sets: 3, reps: 15 },
  { name: "Seated Calf Raise", sets: 3, reps: 15 },
  // Kettlebell
  { name: "Kettlebell Swing", sets: 4, reps: 15 },
  { name: "Kettlebell Goblet Squat", sets: 3, reps: 10 },
  { name: "Turkish Get-Up", sets: 3, reps: 3 },
  { name: "Kettlebell Clean & Press", sets: 3, reps: 8 },
  { name: "Kettlebell Snatch", sets: 3, reps: 8 },
  // Cardio / Conditioning
  { name: "Rowing (Erg)", sets: 1, reps: 1 },
  { name: "Assault Bike", sets: 1, reps: 1 },
  { name: "Ski Erg", sets: 1, reps: 1 },
  { name: "Double Under", sets: 3, reps: 50 },
  { name: "Single Under", sets: 3, reps: 100 },
  { name: "Running", sets: 1, reps: 1 },
  { name: "Sled Push", sets: 4, reps: 1 },
  { name: "Sled Pull", sets: 4, reps: 1 },
  { name: "Farmer's Carry", sets: 3, reps: 1 },
  // Core
  { name: "GHD Sit-Up", sets: 3, reps: 15 },
  { name: "GHD Hip Extension", sets: 3, reps: 15 },
  { name: "Plank", sets: 3, reps: 1 },
  { name: "L-Sit Hold", sets: 3, reps: 1 },
  { name: "Ab Wheel Rollout", sets: 3, reps: 10 },
  { name: "Hanging Leg Raise", sets: 3, reps: 10 },
  { name: "Russian Twist", sets: 3, reps: 20 },
  // Other
  { name: "Wall Ball", sets: 3, reps: 15 },
  { name: "Ball Slam", sets: 3, reps: 10 },
  { name: "Battle Ropes", sets: 3, reps: 1 },
  { name: "Turkish Get-Up", sets: 3, reps: 3 },
  { name: "Bent Over T-Raise", sets: 3, reps: 12 },
];

const newExercise = (): ProgramExercise => ({
  name: "", detail: "", type: "exercise", sets: 3, reps: 8,
  percentage: null, seconds: null, video_url: null, video_type: null,
});

const newRest = (sec = 90): ProgramExercise => ({
  name: "REST", detail: `${sec} seconds`, type: "rest", sets: null, reps: null,
  percentage: null, seconds: sec, video_url: null, video_type: null,
});

// ─── Sub-components ───

function SidebarNav({ active, onChange, onBack }: { active: string; onChange: (v: string) => void; onBack: () => void }) {
  const items = [
    { id: "programs", icon: BookOpen, label: "Programs" },
    { id: "import", icon: Upload, label: "Import JSON" },
    { id: "export", icon: TableProperties, label: "Export" },
    { id: "clients", icon: Users, label: "Clients" },
    { id: "standards", icon: ListChecks, label: "Standards" },
    { id: "leads", icon: ClipboardList, label: "Leads" },
    { id: "check-ins", icon: ClipboardList, label: "Check-Ins", href: "/coach/check-ins" },
    { id: "billing", icon: CreditCard, label: "Billing" },
  ];
  return (
    <div className="w-56 border-r border-border bg-card flex flex-col min-h-dvh shrink-0">
      <div className="p-4 border-b border-border">
        <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-xs mb-3 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to app
        </button>
        <h1 className="text-lg font-black text-foreground flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-primary" /> Coach
        </h1>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {items.map(({ id, icon: Icon, label, href }: { id: string; icon: any; label: string; href?: string }) => (
          <button key={id} onClick={() => href ? (window.location.href = href) : onChange(id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-all ${active === id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"}`}>
            <Icon className="w-4 h-4" /> {label}
          </button>
        ))}
      </nav>
    </div>
  );
}

// ─── Exercise Editor Card ───
const ExerciseEditorCard = memo(function ExerciseEditorCard({
  ex, index, dayIdx, onUpdate, onRemove, onVideoUpload, uploadingVideo, selected, onToggleSelect
}: {
  ex: ProgramExercise; index: number; dayIdx: number;
  onUpdate: (field: string, value: any) => void;
  onRemove: () => void;
  onVideoUpload: (file: File) => void;
  uploadingVideo: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  const [localName, setLocalName] = useState(ex.name);
  const [localDetail, setLocalDetail] = useState(ex.detail);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Sync from parent when exercise changes externally (e.g. template pick)
  useEffect(() => { setLocalName(ex.name); }, [ex.name]);
  useEffect(() => { setLocalDetail(ex.detail); }, [ex.detail]);

  if (ex.type === "rest") {
    return (
      <div className="bg-secondary/50 border border-border rounded-xl p-3 flex items-center gap-3">
        <Timer className="w-4 h-4 text-muted-foreground shrink-0" />
        <div className="flex items-center gap-2 flex-1">
          <span className="text-xs font-bold text-muted-foreground uppercase">Rest</span>
          <input type="number" value={ex.seconds || ""} onChange={e => onUpdate("seconds", Number(e.target.value))} placeholder="sec"
            className="w-16 bg-background border border-border rounded-lg px-2 py-1 text-sm text-center text-foreground" />
          <span className="text-xs text-muted-foreground">seconds</span>
        </div>
        <button onClick={onRemove} className="text-destructive/60 hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>
    );
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 bg-secondary/30 border-b border-border">
        {onToggleSelect && (
          <input type="checkbox" checked={!!selected} onChange={onToggleSelect}
            className="w-4 h-4 rounded border-border accent-primary cursor-pointer" />
        )}
        <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40" />
        <Dumbbell className="w-3.5 h-3.5 text-primary" />
        <span className="text-[10px] font-bold text-muted-foreground uppercase flex-1">Exercise {index + 1}</span>
        <button onClick={onRemove} className="text-destructive/60 hover:text-destructive transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
      </div>

      <div className="p-4 space-y-3">
        {/* Exercise name with searchable dropdown */}
        <div className="relative">
          <input value={localName}
            onChange={e => { setLocalName(e.target.value); setDropdownOpen(true); onUpdate("name", e.target.value); }}
            onFocus={() => setDropdownOpen(true)}
            onBlur={() => { setTimeout(() => setDropdownOpen(false), 200); }}
            placeholder="Type or pick an exercise…"
            className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
          {dropdownOpen && (
            <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl max-h-56 overflow-y-auto">
              {EXERCISE_TEMPLATES
                .filter(t => !localName || t.name.toLowerCase().includes(localName.toLowerCase()))
                .map(t => (
                  <button key={t.name} onMouseDown={e => {
                    e.preventDefault();
                    setLocalName(t.name);
                    onUpdate("name", t.name);
                    onUpdate("sets", t.sets);
                    onUpdate("reps", t.reps);
                    setDropdownOpen(false);
                  }} className="w-full text-left px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors flex items-center justify-between">
                    <span>{t.name}</span>
                    <span className="text-[10px] text-muted-foreground">{t.sets}×{t.reps}</span>
                  </button>
                ))}
              {localName && !EXERCISE_TEMPLATES.some(t => t.name.toLowerCase().includes(localName.toLowerCase())) && (
                <div className="px-3 py-2 text-xs text-muted-foreground">No matches — using custom name</div>
              )}
            </div>
          )}
        </div>

        {/* Detail */}
        <textarea value={localDetail}
          onChange={e => { setLocalDetail(e.target.value); onUpdate("detail", e.target.value); }}
          placeholder="Detail — e.g. 4x6 @ 80%, technique notes, etc."
          rows={2}
          className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none" />

        {/* Sets / Reps / Percentage row */}
        <div className="grid grid-cols-3 gap-2">
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase font-semibold">Sets</label>
            <input type="number" value={ex.sets || ""} onChange={e => onUpdate("sets", Number(e.target.value))} min={1}
              className="w-full bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-center text-foreground focus:outline-none focus:border-primary transition-colors" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase font-semibold">Reps</label>
            <input type="number" value={ex.reps || ""} onChange={e => onUpdate("reps", Number(e.target.value))} min={1}
              className="w-full bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-center text-foreground focus:outline-none focus:border-primary transition-colors" />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] text-muted-foreground uppercase font-semibold">% 1RM</label>
            <input type="number" value={ex.percentage ? Math.round(ex.percentage * 100) : ""} onChange={e => onUpdate("percentage", Number(e.target.value) / 100 || null)}
              placeholder="—"
              className="w-full bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-center text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors" />
          </div>
        </div>

        {/* Video */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-muted-foreground uppercase font-semibold">Video</span>
          <div className="flex gap-1.5 flex-1">
            <button onClick={() => {
              const url = prompt("Paste YouTube URL:");
              if (url) {
                const match = url.match(/(?:youtu\.be\/|v=)([\w-]+)/);
                if (match) { onUpdate("video_url", match[1]); onUpdate("video_type", "youtube"); }
                else toast({ title: "Invalid YouTube URL", variant: "destructive" });
              }
            }} className="flex items-center gap-1 px-2.5 py-1 bg-secondary text-[10px] font-semibold text-muted-foreground rounded-lg hover:text-foreground transition-colors">
              <Youtube className="w-3 h-3" /> YouTube
            </button>
            <label className="flex items-center gap-1 px-2.5 py-1 bg-secondary text-[10px] font-semibold text-muted-foreground rounded-lg hover:text-foreground transition-colors cursor-pointer">
              <Upload className="w-3 h-3" /> {uploadingVideo ? "Uploading…" : "Upload"}
              <input type="file" accept="video/*" className="hidden" onChange={e => { if (e.target.files?.[0]) onVideoUpload(e.target.files[0]); }} />
            </label>
          </div>
          {ex.video_url && (
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-primary font-semibold">
                {ex.video_type === "youtube" ? "YT" : "File"} ✓
              </span>
              <button onClick={() => { onUpdate("video_url", null); onUpdate("video_type", null); }}
                className="text-destructive/60 hover:text-destructive"><X className="w-3 h-3" /></button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

// ─── Main Coach Component ───
export default function Coach() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [isCoach, setIsCoach] = useState<boolean | null>(null);
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  const [section, setSection] = useState("programs");

  // Programs
  const [programs, setPrograms] = useState<Program[]>([]);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);
  const [days, setDays] = useState<ProgramDay[]>([]);
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [programName, setProgramName] = useState("");
  const [programDesc, setProgramDesc] = useState("");
  const [totalDays, setTotalDays] = useState(28);
  const [saving, setSaving] = useState(false);
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [templateDropdownIdx, setTemplateDropdownIdx] = useState<number | null>(null);
  const [copyFromDay, setCopyFromDay] = useState<number | null>(null);
  const [selectedExercises, setSelectedExercises] = useState<Set<number>>(new Set());

  // Clients
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [assignments, setAssignments] = useState<{ user_id: string; program_id: string; current_day: number }[]>([]);
  const [selectedClient, setSelectedClient] = useState<ClientProfile | null>(null);
  const [clientMacros, setClientMacros] = useState<{ calories: number; protein_g: number; carbs_g: number; fat_g: number; updated_at?: string } | null>(null);
  const [clientWeights, setClientWeights] = useState<{ weigh_date: string; weight_lbs: number }[]>([]);
  const [editingMacros, setEditingMacros] = useState(false);
  const [macroForm, setMacroForm] = useState({ calories: 2000, protein_g: 150, carbs_g: 250, fat_g: 65 });
  const [clientCheckIns, setClientCheckIns] = useState<{ check_date: string; compliance: string; actual_calories: number | null; actual_protein_g: number | null; actual_carbs_g: number | null; actual_fat_g: number | null }[]>([]);
  const [clientIsCoach, setClientIsCoach] = useState(false);
  const [togglingCoach, setTogglingCoach] = useState(false);

  // Billing
  const [subscriptionPrice, setSubscriptionPrice] = useState<number | null>(null);
  const [newPrice, setNewPrice] = useState("");
  const [savingPrice, setSavingPrice] = useState(false);
  const [activeSubs, setActiveSubs] = useState<any[]>([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  // Load subscription settings
  useEffect(() => {
    if (isCoach) {
      supabase.from("subscription_settings").select("amount_cents").limit(1).single().then(({ data }) => {
        if (data) setSubscriptionPrice((data as any).amount_cents);
      });
      // Fetch active subscriptions
      setLoadingSubs(true);
      supabase.functions.invoke("list-subscriptions").then(({ data, error }) => {
        if (!error && data?.subscriptions) setActiveSubs(data.subscriptions);
        setLoadingSubs(false);
      });
    }
  }, [isCoach]);

  const updateSubscriptionPrice = async () => {
    const cents = Math.round(Number(newPrice) * 100);
    if (!cents || cents < 100) {
      toast({ title: "Price must be at least $1.00", variant: "destructive" });
      return;
    }
    setSavingPrice(true);
    const { data, error } = await supabase.functions.invoke("create-price", {
      body: { amount_cents: cents },
    });
    if (error || data?.error) {
      toast({ title: data?.error || "Failed to update price", variant: "destructive" });
    } else {
      setSubscriptionPrice(cents);
      setNewPrice("");
      toast({ title: `Subscription set to $${(cents / 100).toFixed(2)}/mo` });
    }
    setSavingPrice(false);
  };

  useEffect(() => {
    if (user) {
      supabase.from("user_roles").select("role").eq("user_id", user.id).in("role", ["coach", "admin"]).then(({ data }) => {
        const roles = new Set((data ?? []).map((r: { role: string }) => r.role));
        setIsAdmin(roles.has("admin"));
        setIsCoach(roles.has("coach") || roles.has("admin"));
      });
    }
  }, [user]);

  useEffect(() => {
    if (isCoach) { loadPrograms(); loadClients(); }
  }, [isCoach]);

  const loadPrograms = async () => {
    const { data } = await supabase.from("programs").select("*").order("created_at", { ascending: false });
    if (data) {
      // Pin the flagship "M2F Guided Journey" to the top of the coach's program list.
      const sorted = [...(data as any[])].sort((a, b) => {
        if (a.name === "M2F Guided Journey") return -1;
        if (b.name === "M2F Guided Journey") return 1;
        return 0;
      });
      setPrograms(sorted as any);
    }
  };

  const loadClients = async () => {
    let query = supabase.from("profiles").select("user_id, display_name, weight_lbs, goal, goal_rate_lb_per_week, assigned_coach_id" as any);
    if (!isAdmin && user) {
      query = query.eq("assigned_coach_id" as any, user.id);
    }
    const { data } = await query;
    if (data) setClients(data as any);
    const { data: a } = await supabase.from("program_assignments").select("user_id, program_id, current_day, is_active").eq("is_active", true);
    if (a) setAssignments(a as any);
  };

  const loadDays = async (programId: string) => {
    const { data } = await supabase.from("program_days").select("*").eq("program_id", programId).order("day_number");
    if (data) setDays(data.map((d: any) => ({ id: d.id, day_number: d.day_number, label: d.label || "", exercises: d.exercises || [] })));
  };

  const loadClientDetails = async (client: ClientProfile) => {
    setSelectedClient(client);
    const { data: macros } = await supabase.from("macro_targets").select("calories, protein_g, carbs_g, fat_g, updated_at").eq("user_id", client.user_id).limit(1).single();
    if (macros) { setClientMacros(macros as any); setMacroForm({ calories: (macros as any).calories, protein_g: (macros as any).protein_g, carbs_g: (macros as any).carbs_g, fat_g: (macros as any).fat_g }); }
    else { setClientMacros(null); setMacroForm({ calories: 2000, protein_g: 150, carbs_g: 250, fat_g: 65 }); }
    const { data: weights } = await supabase.from("daily_weights").select("weigh_date, weight_lbs").eq("user_id", client.user_id).order("weigh_date", { ascending: false }).limit(30);
    if (weights) setClientWeights(weights as any);
    const { data: checkIns } = await supabase.from("daily_check_ins").select("check_date, compliance, actual_calories, actual_protein_g, actual_carbs_g, actual_fat_g").eq("user_id", client.user_id).order("check_date", { ascending: false }).limit(14);
    if (checkIns) setClientCheckIns(checkIns as any);
    // Check if client has coach role
    const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", client.user_id).eq("role", "coach");
    setClientIsCoach(!!roles && roles.length > 0);
  };

  const toggleCoachRole = async () => {
    if (!selectedClient) return;
    setTogglingCoach(true);
    if (clientIsCoach) {
      await supabase.from("user_roles").delete().eq("user_id", selectedClient.user_id).eq("role", "coach");
      setClientIsCoach(false);
      toast({ title: `${selectedClient.display_name || "User"} removed as coach` });
    } else {
      await supabase.from("user_roles").insert({ user_id: selectedClient.user_id, role: "coach" });
      setClientIsCoach(true);
      toast({ title: `${selectedClient.display_name || "User"} promoted to coach` });
    }
    setTogglingCoach(false);
  };

  // ─── Program CRUD ───
  const createProgram = async () => {
    if (!user || !programName) return;
    setSaving(true);
    const { data } = await supabase.from("programs").insert({ name: programName, description: programDesc || null, total_days: totalDays, created_by: user.id, is_published: false } as any).select().single();
    if (data) {
      await loadPrograms();
      setSelectedProgram(data as any);
      setDays([]);
      setShowCreateForm(false);
      setProgramName(""); setProgramDesc("");
      toast({ title: "Program created" });
    }
    setSaving(false);
  };

  const deleteProgram = async (id: string) => {
    await supabase.from("programs").delete().eq("id", id);
    setSelectedProgram(null);
    setDays([]);
    setEditingDay(null);
    await loadPrograms();
    toast({ title: "Program deleted" });
  };

  const openProgram = async (p: Program) => {
    setSelectedProgram(p);
    setEditingDay(null);
    await loadDays(p.id);
  };

  // ─── Day CRUD ───
  const ensureDayExists = (dayNum: number) => {
    if (!days.find(d => d.day_number === dayNum)) {
      setDays(prev => [...prev, { day_number: dayNum, label: `Day ${dayNum}`, exercises: [] }].sort((a, b) => a.day_number - b.day_number));
    }
  };

  const saveDay = async (day: ProgramDay) => {
    if (!selectedProgram) return;
    setSaving(true);
    try {
      if (day.id) {
        const { error } = await supabase.from("program_days").update({ label: day.label, exercises: day.exercises as any }).eq("id", day.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase.from("program_days").insert({ program_id: selectedProgram.id, day_number: day.day_number, label: day.label, exercises: day.exercises as any }).select().single();
        if (error) throw error;
        if (data) setDays(prev => prev.map(d => d.day_number === day.day_number ? { ...d, id: (data as any).id } : d));
      }
      toast({ title: `Day ${day.day_number} saved` });
    } catch (err: any) {
      console.error("Save failed:", err);
      toast({ title: "Save failed", description: err.message || "Please try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const copyDay = (fromDayNum: number, toDayNum: number) => {
    const source = days.find(d => d.day_number === fromDayNum);
    if (!source) return;
    const existing = days.find(d => d.day_number === toDayNum);
    if (existing) {
      setDays(prev => prev.map(d => d.day_number === toDayNum ? { ...d, exercises: [...source.exercises], label: `Day ${toDayNum}` } : d));
    } else {
      setDays(prev => [...prev, { day_number: toDayNum, label: `Day ${toDayNum}`, exercises: [...source.exercises] }].sort((a, b) => a.day_number - b.day_number));
    }
    toast({ title: `Copied Day ${fromDayNum} → Day ${toDayNum}` });
  };

  // ─── Exercise CRUD ───
  const updateExercise = (dayIdx: number, exIdx: number, field: string, value: any) => {
    setDays(prev => prev.map((d, i) => i === dayIdx ? {
      ...d, exercises: d.exercises.map((ex, j) => j === exIdx ? { ...ex, [field]: value } : ex)
    } : d));
  };

  const removeExercise = (dayIdx: number, exIdx: number) => {
    setDays(prev => prev.map((d, i) => i === dayIdx ? { ...d, exercises: d.exercises.filter((_, j) => j !== exIdx) } : d));
  };

  const addExercise = (dayIdx: number) => {
    setDays(prev => prev.map((d, i) => i === dayIdx ? { ...d, exercises: [...d.exercises, newExercise()] } : d));
  };

  const addRest = (dayIdx: number) => {
    setDays(prev => prev.map((d, i) => i === dayIdx ? { ...d, exercises: [...d.exercises, newRest()] } : d));
  };

  const moveExercise = (dayIdx: number, fromIdx: number, direction: "up" | "down") => {
    const toIdx = direction === "up" ? fromIdx - 1 : fromIdx + 1;
    setDays(prev => prev.map((d, i) => {
      if (i !== dayIdx) return d;
      if (toIdx < 0 || toIdx >= d.exercises.length) return d;
      const exs = [...d.exercises];
      [exs[fromIdx], exs[toIdx]] = [exs[toIdx], exs[fromIdx]];
      return { ...d, exercises: exs };
    }));
  };

  const handleVideoUpload = async (dayIdx: number, exIdx: number, file: File) => {
    if (!selectedProgram) return;
    setUploadingVideo(true);
    const path = `${selectedProgram.id}/${Date.now()}_${file.name}`;
    const { data, error } = await supabase.storage.from("exercise-videos").upload(path, file);
    if (data && !error) {
      const { data: urlData } = await supabase.storage.from("exercise-videos").createSignedUrl(path, 60 * 60 * 24 * 365);
      updateExercise(dayIdx, exIdx, "video_url", urlData?.signedUrl || path);
      updateExercise(dayIdx, exIdx, "video_type", "upload");
      toast({ title: "Video uploaded" });
    }
    setUploadingVideo(false);
  };

  // ─── Client actions ───
  const assignProgram = async (userId: string, programId: string) => {
    if (!user) return;
    const existing = assignments.find(a => a.user_id === userId && a.program_id === programId);
    if (existing) {
      // Unassign: deactivate
      await supabase.from("program_assignments").update({ is_active: false }).eq("user_id", userId).eq("program_id", programId).eq("is_active", true);
    } else {
      // Deactivate current active assignments for this user
      await supabase.from("program_assignments").update({ is_active: false }).eq("user_id", userId).eq("is_active", true);
      // Check for existing inactive assignment for this program
      const { data: inactive } = await supabase.from("program_assignments").select("id").eq("user_id", userId).eq("program_id", programId).eq("is_active", false).limit(1);
      if (inactive && inactive.length > 0) {
        // Reactivate — resume progress
        await supabase.from("program_assignments").update({ is_active: true }).eq("id", inactive[0].id);
      } else {
        await supabase.from("program_assignments").insert({ user_id: userId, program_id: programId, assigned_by: user.id, is_active: true });
      }
    }
    await loadClients();
    toast({ title: existing ? "Program unassigned" : "Program assigned" });
  };

  const saveMacros = async () => {
    if (!selectedClient || !user) return;
    setSaving(true);
    if (clientMacros) {
      await supabase.from("macro_targets").update({ ...macroForm, set_by: user.id }).eq("user_id", selectedClient.user_id);
    } else {
      await supabase.from("macro_targets").insert({ ...macroForm, user_id: selectedClient.user_id, set_by: user.id });
    }
    setClientMacros(macroForm);
    setEditingMacros(false);
    setSaving(false);
    toast({ title: "Macros updated" });
  };

  // ─── Guards ───
  if (loading || isCoach === null) return <div className="flex items-center justify-center min-h-dvh bg-background"><p className="text-muted-foreground">Loading...</p></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!isCoach) return (
    <div className="flex flex-col items-center justify-center min-h-dvh bg-background gap-4">
      <LayoutDashboard className="w-10 h-10 text-muted-foreground" />
      <p className="text-foreground font-bold text-lg">Coach Access Required</p>
      <p className="text-muted-foreground text-sm max-w-xs text-center">You need coach permissions to access this dashboard.</p>
      <button onClick={() => navigate("/")} className="text-primary text-sm font-semibold hover:underline">← Back to app</button>
    </div>
  );

  // ═══════════════════════════════════════
  // ─── RENDER ───
  // ═══════════════════════════════════════

  return (
    <div className="flex min-h-dvh bg-background">
      <SidebarNav active={section} onChange={setSection} onBack={() => navigate("/")} />

      <div className="flex-1 overflow-y-auto">
        {section === "programs" && (
          <div className="flex h-full">
            {/* Program list panel */}
            <div className="w-72 border-r border-border bg-card/50 flex flex-col shrink-0 h-dvh overflow-y-auto">
              <div className="p-4 border-b border-border flex items-center justify-between">
                <h2 className="font-bold text-foreground text-sm">Programs</h2>
                <button onClick={() => setShowCreateForm(!showCreateForm)}
                  className="p-1.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              {showCreateForm && (
                <div className="p-3 border-b border-border space-y-2">
                  <input value={programName} onChange={e => setProgramName(e.target.value)} placeholder="Program name"
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
                  <input value={programDesc} onChange={e => setProgramDesc(e.target.value)} placeholder="Description"
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-muted-foreground shrink-0">Days:</label>
                    <input type="number" value={totalDays} onChange={e => setTotalDays(Number(e.target.value))} min={1}
                      className="w-16 bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-center text-foreground" />
                  </div>
                  <button onClick={createProgram} disabled={!programName || saving}
                    className="w-full py-2 rounded-lg bg-primary text-primary-foreground font-semibold text-xs hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {saving ? "Creating…" : "Create"}
                  </button>
                </div>
              )}

              <div className="flex-1 p-2 space-y-1">
                {programs.map(p => (
                  <button key={p.id} onClick={() => openProgram(p)}
                    className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${selectedProgram?.id === p.id ? "bg-primary/10 text-primary font-bold" : "text-foreground hover:bg-secondary"}`}>
                    <p className="font-semibold truncate">
                      {p.name}
                      {p.name === "M2F Guided Journey" && <span className="ml-1.5 text-[9px] font-bold uppercase text-primary bg-primary/15 border border-primary/40 px-1.5 py-0.5 rounded">Flagship</span>}
                      {!p.is_published && <span className="ml-1.5 text-[9px] font-bold uppercase text-muted-foreground bg-muted px-1.5 py-0.5 rounded">Draft</span>}
                    </p>
                    <p className="text-[10px] text-muted-foreground">{p.total_days} days</p>
                  </button>
                ))}
                {programs.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">No programs yet</p>}
              </div>
            </div>

            {/* Program editor panel */}
            <div className="flex-1 overflow-y-auto h-dvh">
              {!selectedProgram ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                  <BookOpen className="w-10 h-10" />
                  <p className="text-sm font-semibold">Select or create a program</p>
                </div>
              ) : (
                <div className="p-6 max-w-3xl">
                  {/* Program header — editable */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex-1 mr-4 space-y-1">
                      <input
                        value={selectedProgram.name}
                        onChange={e => setSelectedProgram({ ...selectedProgram, name: e.target.value })}
                        onBlur={async () => {
                          await supabase.from("programs").update({ name: selectedProgram.name }).eq("id", selectedProgram.id);
                          setPrograms(prev => prev.map(p => p.id === selectedProgram.id ? { ...p, name: selectedProgram.name } : p));
                        }}
                        className="text-2xl font-black text-foreground bg-transparent border-b border-transparent hover:border-border focus:border-primary focus:outline-none w-full pb-0.5 transition-colors"
                      />
                      <textarea
                        value={selectedProgram.description || ""}
                        onChange={e => setSelectedProgram({ ...selectedProgram, description: e.target.value })}
                        onBlur={async () => {
                          await supabase.from("programs").update({ description: selectedProgram.description || null }).eq("id", selectedProgram.id);
                          setPrograms(prev => prev.map(p => p.id === selectedProgram.id ? { ...p, description: selectedProgram.description } : p));
                        }}
                        placeholder="Add program notes or description…"
                        rows={2}
                        className="text-sm text-muted-foreground bg-transparent border border-transparent hover:border-border focus:border-primary focus:outline-none w-full rounded-lg px-0 py-1 resize-none placeholder:text-muted-foreground/50 transition-colors"
                      />
                      <p className="text-xs text-primary font-semibold">{selectedProgram.total_days} day program</p>
                    </div>
                    <button onClick={() => { if (confirm("Delete this program?")) deleteProgram(selectedProgram.id); }}
                      className="text-destructive/60 hover:text-destructive p-2 rounded-lg hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Publish controls */}
                  <div className="mb-6 p-4 rounded-xl border border-border bg-secondary/50 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-bold text-foreground">Visibility</p>
                        <p className="text-xs text-muted-foreground">
                          {selectedProgram.is_published ? "Clients can see this program" : "Hidden from clients (draft)"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold ${selectedProgram.is_published ? "text-green-500" : "text-muted-foreground"}`}>
                          {selectedProgram.is_published ? "Published" : "Draft"}
                        </span>
                        <Switch
                          checked={selectedProgram.is_published}
                          onCheckedChange={async (checked) => {
                            await supabase.from("programs").update({ is_published: checked }).eq("id", selectedProgram.id);
                            setSelectedProgram({ ...selectedProgram, is_published: checked });
                            setPrograms(prev => prev.map(p => p.id === selectedProgram.id ? { ...p, is_published: checked } : p));
                            toast({ title: checked ? "Program published" : "Program hidden from clients" });
                          }}
                        />
                      </div>
                    </div>
                    {selectedProgram.is_published && (
                      <div className="flex items-center gap-3">
                        <label className="text-xs text-muted-foreground shrink-0">Show days 1 through:</label>
                        <input
                          type="number"
                          min={1}
                          max={selectedProgram.total_days}
                          value={selectedProgram.published_through_day ?? selectedProgram.total_days}
                          onChange={async (e) => {
                            const val = Number(e.target.value);
                            const throughDay = val >= selectedProgram.total_days ? null : val;
                            await supabase.from("programs").update({ published_through_day: throughDay }).eq("id", selectedProgram.id);
                            setSelectedProgram({ ...selectedProgram, published_through_day: throughDay });
                            setPrograms(prev => prev.map(p => p.id === selectedProgram.id ? { ...p, published_through_day: throughDay } : p));
                          }}
                          className="w-20 bg-secondary border border-border rounded-lg px-2 py-1.5 text-sm text-center text-foreground focus:outline-none focus:border-primary"
                        />
                        <span className="text-xs text-muted-foreground">
                          of {selectedProgram.total_days}
                          {selectedProgram.published_through_day && ` (Day ${selectedProgram.published_through_day + 1}+ hidden)`}
                        </span>
                      </div>
                    )}
                  </div>

                  {selectedProgram.name === "M2F Guided Journey" && (
                    <div className="mb-6"><FlagshipProgramView /></div>
                  )}

                  {/* Day calendar grid */}
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-bold text-muted-foreground uppercase">Days</p>
                      {editingDay !== null && (
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">Copy to Day {editingDay} from:</span>
                          <select
                            value={copyFromDay ?? ""}
                            onChange={e => {
                              const from = Number(e.target.value);
                              if (from && editingDay) { copyDay(from, editingDay); setCopyFromDay(null); }
                            }}
                            className="bg-secondary border border-border rounded-lg px-2 py-1 text-xs text-foreground"
                          >
                            <option value="">Select day…</option>
                            {days.filter(d => d.exercises.length > 0 && d.day_number !== editingDay).map(d => (
                              <option key={d.day_number} value={d.day_number}>Day {d.day_number}</option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                    <div className="grid grid-cols-7 sm:grid-cols-10 gap-1.5">
                      {Array.from({ length: selectedProgram.total_days }, (_, i) => i + 1).map(dayNum => {
                        const dayData = days.find(d => d.day_number === dayNum);
                        const hasExercises = dayData && dayData.exercises.length > 0;
                        const isEditing = editingDay === dayNum;
                        return (
                          <button key={dayNum} onClick={() => { ensureDayExists(dayNum); setEditingDay(dayNum); setSelectedExercises(new Set()); }}
                            className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-bold transition-all ${
                              isEditing ? "bg-primary text-primary-foreground ring-2 ring-primary/40 scale-105" :
                              hasExercises ? "bg-primary/15 text-primary hover:bg-primary/25" :
                              "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                            }`}>
                            {dayNum}
                            {hasExercises && !isEditing && <span className="w-1 h-1 rounded-full bg-primary mt-0.5" />}
                          </button>
                        );
                      })}
                    </div>
                    <button onClick={async () => {
                      const newTotal = selectedProgram.total_days + 1;
                      await supabase.from("programs").update({ total_days: newTotal }).eq("id", selectedProgram.id);
                      setSelectedProgram({ ...selectedProgram, total_days: newTotal });
                      toast({ title: `Added Day ${newTotal}` });
                    }}
                      className="mt-2 flex items-center justify-center gap-2 w-full py-2 border border-dashed border-border rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Add Day
                    </button>
                  </div>

                  {/* Day editor */}
                  {editingDay !== null && (() => {
                    const dayIdx = days.findIndex(d => d.day_number === editingDay);
                    if (dayIdx === -1) return null;
                    const day = days[dayIdx];
                    return (
                      <div className="border-t border-border pt-6 space-y-4">
                        <div className="flex items-center gap-3">
                          <input value={day.label} onChange={e => setDays(prev => prev.map((d, i) => i === dayIdx ? { ...d, label: e.target.value } : d))}
                            className="text-lg font-bold bg-transparent text-foreground border-b border-border focus:border-primary focus:outline-none pb-1 flex-1" placeholder="Day label" />
                          <span className="text-xs text-muted-foreground">{day.exercises.filter(e => e.type === "exercise").length} exercises</span>
                          <button onClick={async () => {
                            if (!confirm(`Delete Day ${editingDay}? This will remove all exercises for this day.`)) return;
                            // Delete from DB if it exists
                            if (day.id) {
                              await supabase.from("program_days").delete().eq("id", day.id);
                            }
                            // Remove from local state
                            setDays(prev => prev.filter((_, i) => i !== dayIdx));
                            // Decrease total_days on program
                            if (selectedProgram && editingDay === selectedProgram.total_days) {
                              const newTotal = selectedProgram.total_days - 1;
                              await supabase.from("programs").update({ total_days: newTotal }).eq("id", selectedProgram.id);
                              setSelectedProgram({ ...selectedProgram, total_days: newTotal });
                            }
                            setEditingDay(null);
                            toast({ title: `Day ${editingDay} deleted` });
                          }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-destructive/70 hover:text-destructive hover:bg-destructive/10 transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /> Delete Day
                          </button>
                        </div>

                        <div className="space-y-2">
                          {(() => {
                            const exercises = day.exercises;
                            const rendered: JSX.Element[] = [];
                            let i = 0;
                            while (i < exercises.length) {
                              const ex = exercises[i];
                              if (ex.group) {
                                // Collect all exercises in this superset group
                                const groupId = ex.group;
                                const groupStart = i;
                                const groupExercises: { ex: ProgramExercise; idx: number }[] = [];
                                while (i < exercises.length && exercises[i].group === groupId) {
                                  groupExercises.push({ ex: exercises[i], idx: i });
                                  i++;
                                }
                                rendered.push(
                                  <div key={`group-${groupId}-${groupStart}`} className="border-2 border-primary/30 rounded-xl p-2 space-y-2 bg-primary/5 relative">
                                    <div className="flex items-center justify-between px-2 py-1">
                                      <span className="text-[10px] font-bold text-primary uppercase flex items-center gap-1.5">
                                        <Link2 className="w-3 h-3" /> Superset ({groupExercises.length})
                                      </span>
                                      <button onClick={() => {
                                        setDays(prev => prev.map((d, di) => di === dayIdx ? {
                                          ...d, exercises: d.exercises.map(e => e.group === groupId ? { ...e, group: undefined } : e)
                                        } : d));
                                      }} className="text-[10px] text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors">
                                        <Unlink className="w-3 h-3" /> Ungroup
                                      </button>
                                    </div>
                                    {groupExercises.map(({ ex: gEx, idx: gIdx }) => (
                                      <div key={gIdx} className="relative">
                                        {gEx.type === "exercise" && (
                                          <div className="absolute -left-1 top-1/2 -translate-y-1/2 flex flex-col gap-0.5 z-10">
                                            {gIdx > 0 && <button onClick={() => moveExercise(dayIdx, gIdx, "up")} className="text-muted-foreground/40 hover:text-muted-foreground"><ChevronUp className="w-3.5 h-3.5" /></button>}
                                            {gIdx < exercises.length - 1 && <button onClick={() => moveExercise(dayIdx, gIdx, "down")} className="text-muted-foreground/40 hover:text-muted-foreground"><ChevronDown className="w-3.5 h-3.5" /></button>}
                                          </div>
                                        )}
                                        <ExerciseEditorCard
                                          ex={gEx} index={gIdx} dayIdx={dayIdx}
                                          onUpdate={(field, value) => updateExercise(dayIdx, gIdx, field, value)}
                                          onRemove={() => removeExercise(dayIdx, gIdx)}
                                          onVideoUpload={(file) => handleVideoUpload(dayIdx, gIdx, file)}
                                          uploadingVideo={uploadingVideo}
                                          selected={selectedExercises.has(gIdx)}
                                          onToggleSelect={() => setSelectedExercises(prev => {
                                            const next = new Set(prev);
                                            next.has(gIdx) ? next.delete(gIdx) : next.add(gIdx);
                                            return next;
                                          })}
                                        />
                                      </div>
                                    ))}
                                    <button onClick={() => {
                                      setDays(prev => prev.map((d, di) => di === dayIdx ? {
                                        ...d, exercises: [...d.exercises.slice(0, i), { ...newExercise(), group: groupId }, ...d.exercises.slice(i)]
                                      } : d));
                                    }} className="w-full flex items-center justify-center gap-1.5 py-2 border border-dashed border-primary/30 rounded-lg text-[10px] font-semibold text-primary/60 hover:text-primary hover:border-primary/50 transition-colors">
                                      <Plus className="w-3 h-3" /> Add to superset
                                    </button>
                                  </div>
                                );
                              } else {
                                rendered.push(
                                  <div key={i} className="relative">
                                    {ex.type === "exercise" && (
                                      <div className="absolute -left-7 top-1/2 -translate-y-1/2 flex flex-col gap-0.5">
                                        {i > 0 && <button onClick={() => moveExercise(dayIdx, i, "up")} className="text-muted-foreground/40 hover:text-muted-foreground"><ChevronUp className="w-3.5 h-3.5" /></button>}
                                        {i < exercises.length - 1 && <button onClick={() => moveExercise(dayIdx, i, "down")} className="text-muted-foreground/40 hover:text-muted-foreground"><ChevronDown className="w-3.5 h-3.5" /></button>}
                                      </div>
                                    )}
                                    <ExerciseEditorCard
                                      ex={ex} index={i} dayIdx={dayIdx}
                                      onUpdate={(field, value) => updateExercise(dayIdx, i, field, value)}
                                      onRemove={() => removeExercise(dayIdx, i)}
                                      onVideoUpload={(file) => handleVideoUpload(dayIdx, i, file)}
                                      uploadingVideo={uploadingVideo}
                                      selected={selectedExercises.has(i)}
                                      onToggleSelect={() => setSelectedExercises(prev => {
                                        const next = new Set(prev);
                                        next.has(i) ? next.delete(i) : next.add(i);
                                        return next;
                                      })}
                                    />
                                  </div>
                                );
                                i++;
                              }
                            }
                            return rendered;
                          })()}
                        </div>

                        {/* Add buttons */}
                        <div className="flex gap-2">
                          <button onClick={() => addExercise(dayIdx)}
                            className="flex-1 flex items-center justify-center gap-2 py-3 border border-dashed border-border rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
                            <Dumbbell className="w-3.5 h-3.5" /> Add Exercise
                          </button>
                          <button onClick={() => addRest(dayIdx)}
                            className="flex items-center justify-center gap-2 px-5 py-3 border border-dashed border-border rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
                            <Timer className="w-3.5 h-3.5" /> Rest
                          </button>
                          <button onClick={() => {
                            const selected = Array.from(selectedExercises);
                            const validSelected = selected.filter(idx => day.exercises[idx]?.type === "exercise");
                            if (validSelected.length >= 2) {
                              const groupId = `ss_${Date.now()}`;
                              setDays(prev => prev.map((d, di) => di === dayIdx ? {
                                ...d, exercises: d.exercises.map((e, ei) =>
                                  validSelected.includes(ei) ? { ...e, group: groupId } : e
                                )
                              } : d));
                              setSelectedExercises(new Set());
                              toast({ title: `Superset created from ${validSelected.length} exercises` });
                            } else {
                              toast({ title: "Select at least 2 exercises to superset", variant: "destructive" });
                            }
                          }}
                            disabled={selectedExercises.size < 2}
                            className={`flex items-center justify-center gap-2 px-5 py-3 border border-dashed rounded-xl text-xs font-semibold transition-colors ${
                              selectedExercises.size >= 2
                                ? "border-primary text-primary hover:bg-primary/10"
                                : "border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                            }`}>
                            <Link2 className="w-3.5 h-3.5" /> Superset{selectedExercises.size >= 2 ? ` (${selectedExercises.size})` : ""}
                          </button>
                        </div>

                        {/* Save */}
                        <button onClick={() => saveDay(day)} disabled={saving}
                          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
                          <Save className="w-4 h-4" /> {saving ? "Saving…" : `Save Day ${editingDay}`}
                        </button>
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </div>
        )}

        {section === "clients" && (
          <div className="flex h-full">
            {/* Client list */}
            <div className="w-72 border-r border-border bg-card/50 flex flex-col shrink-0 h-dvh overflow-y-auto">
              <div className="p-4 border-b border-border">
                <h2 className="font-bold text-foreground text-sm">Clients</h2>
                <p className="text-[10px] text-muted-foreground mt-0.5">{clients.length} total</p>
              </div>
              <div className="flex-1 p-2 space-y-1">
                {clients.map(c => {
                  const clientAssignment = assignments.find(a => a.user_id === c.user_id);
                  const prog = clientAssignment ? programs.find(p => p.id === clientAssignment.program_id) : null;
                  return (
                    <button key={c.user_id} onClick={() => loadClientDetails(c)}
                      className={`w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all ${selectedClient?.user_id === c.user_id ? "bg-primary/10 text-primary" : "text-foreground hover:bg-secondary"}`}>
                      <p className="font-semibold truncate">{c.display_name || "Unnamed"}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {prog ? `${prog.name} • Day ${clientAssignment?.current_day}` : "No program"}
                      </p>
                    </button>
                  );
                })}
                {clients.length === 0 && <p className="text-xs text-muted-foreground text-center py-6">No clients yet</p>}
              </div>
            </div>

            {/* Client detail */}
            <div className="flex-1 overflow-y-auto h-dvh">
              {!selectedClient ? (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                  <UserCircle className="w-10 h-10" />
                  <p className="text-sm font-semibold">Select a client</p>
                </div>
              ) : (
                <div className="p-6 max-w-2xl space-y-6">
                  {/* Client header */}
                  <div>
                    <h2 className="text-2xl font-black text-foreground">{selectedClient.display_name || "Unnamed"}</h2>
                    <div className="flex gap-3 mt-2">
                      {selectedClient.weight_lbs && (
                        <span className="text-xs bg-secondary px-2.5 py-1 rounded-lg text-muted-foreground font-semibold">
                          <Weight className="w-3 h-3 inline mr-1" />{selectedClient.weight_lbs} lbs
                        </span>
                      )}
                      {selectedClient.goal && (
                        <span className="text-xs bg-secondary px-2.5 py-1 rounded-lg text-muted-foreground font-semibold capitalize">
                          🎯 {selectedClient.goal}
                        </span>
                      )}
                    </div>
                    {/* Coach Role Toggle */}
                    <button onClick={toggleCoachRole} disabled={togglingCoach}
                      className={`mt-3 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${clientIsCoach ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground border border-border"}`}>
                      <Settings className="w-3 h-3" />
                      {togglingCoach ? "Updating…" : clientIsCoach ? "Coach ✓" : "Make Coach"}
                    </button>
                  </div>

                  {/* Assign Program */}
                  <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Assigned Program</p>
                    <div className="flex flex-wrap gap-2">
                      {programs.map(p => {
                        const assigned = assignments.some(a => a.user_id === selectedClient.user_id && a.program_id === p.id);
                        return (
                          <button key={p.id} onClick={() => assignProgram(selectedClient.user_id, p.id)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${assigned ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"}`}>
                            {p.name} {assigned && "✓"}
                          </button>
                        );
                      })}
                    </div>
                    {/* Day picker for assigned program */}
                    {(() => {
                      const clientAssignment = assignments.find(a => a.user_id === selectedClient.user_id);
                      if (!clientAssignment) return null;
                      const prog = programs.find(p => p.id === clientAssignment.program_id);
                      if (!prog) return null;
                      return (
                        <div className="pt-2 border-t border-border space-y-2">
                          <p className="text-[10px] font-bold text-muted-foreground uppercase">Current Day</p>
                          <div className="flex items-center gap-3">
                            <input
                              type="number"
                              min={1}
                              max={prog.total_days}
                              value={clientAssignment.current_day}
                              onChange={e => {
                                const val = Math.max(1, Math.min(prog.total_days, Number(e.target.value)));
                                setAssignments(prev => prev.map(a => a.user_id === selectedClient.user_id ? { ...a, current_day: val } : a));
                              }}
                              className="w-20 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground text-center focus:outline-none focus:border-primary"
                            />
                            <span className="text-xs text-muted-foreground">of {prog.total_days} days</span>
                            <button
                              onClick={async () => {
                                const assignment = assignments.find(a => a.user_id === selectedClient.user_id);
                                if (!assignment) return;
                                await supabase.from("program_assignments").update({ current_day: assignment.current_day }).eq("user_id", selectedClient.user_id).eq("program_id", assignment.program_id).eq("is_active", true);
                                toast({ title: `Set to Day ${assignment.current_day}` });
                              }}
                              className="px-3 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:bg-primary/90 transition-colors"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Macro Targets */}
                  <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-muted-foreground uppercase">Macro Targets</p>
                      <button onClick={() => setEditingMacros(!editingMacros)}
                        className="text-xs text-primary font-semibold hover:underline">
                        {editingMacros ? "Cancel" : "Edit"}
                      </button>
                    </div>
                    {editingMacros ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          {(["protein_g", "carbs_g", "fat_g"] as const).map(key => (
                            <div key={key} className="space-y-1">
                              <label className="text-[10px] text-muted-foreground uppercase font-semibold">
                                {key.replace("_g", " (g)")}
                              </label>
                              <input type="number" value={macroForm[key]}
                                onChange={e => {
                                  const val = Number(e.target.value);
                                  setMacroForm(prev => {
                                    const next = { ...prev, [key]: val };
                                    next.calories = next.protein_g * 4 + next.carbs_g * 4 + next.fat_g * 9;
                                    return next;
                                  });
                                }}
                                className="w-full bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground text-center focus:outline-none focus:border-primary" />
                            </div>
                          ))}
                        </div>
                        <div className="text-center py-2 bg-secondary/50 rounded-lg">
                          <span className="text-2xl font-black text-foreground">{macroForm.protein_g * 4 + macroForm.carbs_g * 4 + macroForm.fat_g * 9}</span>
                          <span className="text-xs text-muted-foreground ml-1">cal (auto-calculated)</span>
                        </div>
                        <button onClick={saveMacros} disabled={saving}
                          className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-colors disabled:opacity-50">
                          {saving ? "Saving…" : "Save Targets"}
                        </button>
                      </div>
                    ) : clientMacros ? (
                      <div className="grid grid-cols-4 gap-2">
                        {[
                          { label: "Calories", value: clientMacros.calories, unit: "kcal" },
                          { label: "Protein", value: clientMacros.protein_g, unit: "g" },
                          { label: "Carbs", value: clientMacros.carbs_g, unit: "g" },
                          { label: "Fat", value: clientMacros.fat_g, unit: "g" },
                        ].map(m => (
                          <div key={m.label} className="text-center">
                            <p className="text-lg font-black text-foreground">{m.value}</p>
                            <p className="text-[10px] text-muted-foreground uppercase">{m.label}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground">No targets set. Click Edit to add.</p>
                    )}
                  </div>

                  {/* Weekly Weight Summary */}
                  <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <p className="text-xs font-bold text-muted-foreground uppercase">Weekly Weight</p>
                    </div>
                    {(() => {
                      if (clientWeights.length === 0) return <p className="text-xs text-muted-foreground">No weigh-ins recorded.</p>;
                      const today = new Date();
                      const startOfThisWeek = new Date(today);
                      startOfThisWeek.setDate(today.getDate() - today.getDay());
                      const startOfLastWeek = new Date(startOfThisWeek);
                      startOfLastWeek.setDate(startOfLastWeek.getDate() - 7);

                      const thisWeek = clientWeights.filter(w => {
                        const d = new Date(w.weigh_date + "T00:00:00");
                        return d >= startOfThisWeek && d <= today;
                      });
                      const lastWeek = clientWeights.filter(w => {
                        const d = new Date(w.weigh_date + "T00:00:00");
                        return d >= startOfLastWeek && d < startOfThisWeek;
                      });

                      const avgThis = thisWeek.length > 0 ? thisWeek.reduce((s, w) => s + Number(w.weight_lbs), 0) / thisWeek.length : null;
                      const avgLast = lastWeek.length > 0 ? lastWeek.reduce((s, w) => s + Number(w.weight_lbs), 0) / lastWeek.length : null;
                      const diff = avgThis !== null && avgLast !== null ? avgThis - avgLast : null;

                      return (
                        <div className="space-y-3">
                          <div className="grid grid-cols-3 gap-3">
                            <div className="text-center">
                              <p className="text-lg font-black text-foreground">{avgThis !== null ? avgThis.toFixed(1) : "—"}</p>
                              <p className="text-[10px] text-muted-foreground uppercase">This Week Avg</p>
                            </div>
                            <div className="text-center">
                              <p className="text-lg font-black text-foreground">{avgLast !== null ? avgLast.toFixed(1) : "—"}</p>
                              <p className="text-[10px] text-muted-foreground uppercase">Last Week Avg</p>
                            </div>
                            <div className="text-center">
                              {diff !== null ? (
                                <>
                                  <p className={`text-lg font-black ${diff < 0 ? "text-green-500" : diff > 0 ? "text-red-500" : "text-foreground"}`}>
                                    {diff > 0 ? "+" : ""}{diff.toFixed(1)}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground uppercase">
                                    {diff < 0 ? "Lost" : diff > 0 ? "Gained" : "No Change"}
                                  </p>
                                </>
                              ) : (
                                <>
                                  <p className="text-lg font-black text-foreground">—</p>
                                  <p className="text-[10px] text-muted-foreground uppercase">Change</p>
                                </>
                              )}
                            </div>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Daily Log</p>
                            {clientWeights.slice(0, 14).map((w, i) => (
                              <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                                <span className="text-xs text-muted-foreground">
                                  {new Date(w.weigh_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                </span>
                                <span className="text-sm font-bold text-foreground">{w.weight_lbs} lbs</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Macro Check-Ins — 7-Day Averages */}
                  <div className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-bold text-muted-foreground uppercase">Macro Check-Ins (7-Day Avg)</p>
                      {clientMacros?.updated_at && (
                        <span className="text-[10px] text-muted-foreground">
                          Last adjusted: {new Date(clientMacros.updated_at).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                        </span>
                      )}
                    </div>
                    {(() => {
                      const last7 = clientCheckIns.filter(ci => {
                        const d = new Date(ci.check_date + "T00:00:00");
                        const now = new Date();
                        const diff = (now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24);
                        return diff <= 7;
                      });
                      const withData = last7.filter(ci => ci.actual_calories != null);
                      if (withData.length === 0) return <p className="text-xs text-muted-foreground">No check-in data in the last 7 days.</p>;

                      const avgCal = Math.round(withData.reduce((s, ci) => s + (ci.actual_calories || 0), 0) / withData.length);
                      const avgP = Math.round(withData.reduce((s, ci) => s + (ci.actual_protein_g || 0), 0) / withData.length);
                      const avgC = Math.round(withData.reduce((s, ci) => s + (ci.actual_carbs_g || 0), 0) / withData.length);
                      const avgF = Math.round(withData.reduce((s, ci) => s + (ci.actual_fat_g || 0), 0) / withData.length);

                      const atCount = last7.filter(ci => ci.compliance === "at").length;
                      const aboveCount = last7.filter(ci => ci.compliance === "above").length;
                      const belowCount = last7.filter(ci => ci.compliance === "below").length;

                      return (
                        <div className="space-y-3">
                          {/* Avg macros vs targets */}
                          <div className="grid grid-cols-4 gap-2">
                            {[
                              { label: "Calories", avg: avgCal, target: clientMacros?.calories, unit: "" },
                              { label: "Protein", avg: avgP, target: clientMacros?.protein_g, unit: "g" },
                              { label: "Carbs", avg: avgC, target: clientMacros?.carbs_g, unit: "g" },
                              { label: "Fat", avg: avgF, target: clientMacros?.fat_g, unit: "g" },
                            ].map(m => {
                              const diff = m.target ? m.avg - m.target : 0;
                              return (
                                <div key={m.label} className="text-center">
                                  <p className="text-lg font-black text-foreground">{m.avg}{m.unit}</p>
                                  <p className="text-[10px] text-muted-foreground uppercase">{m.label}</p>
                                  {m.target && (
                                    <p className={`text-[10px] font-bold ${diff > 0 ? "text-red-500" : diff < 0 ? "text-yellow-500" : "text-green-500"}`}>
                                      {diff > 0 ? "+" : ""}{diff} vs target
                                    </p>
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          {/* Compliance summary */}
                          <div className="flex items-center gap-2 text-[10px]">
                            <span className="font-semibold text-muted-foreground">{withData.length} check-ins:</span>
                            {atCount > 0 && <span className="bg-green-500/15 text-green-500 font-bold px-2 py-0.5 rounded-full">{atCount} at</span>}
                            {aboveCount > 0 && <span className="bg-red-500/15 text-red-500 font-bold px-2 py-0.5 rounded-full">{aboveCount} above</span>}
                            {belowCount > 0 && <span className="bg-yellow-500/15 text-yellow-500 font-bold px-2 py-0.5 rounded-full">{belowCount} below</span>}
                          </div>

                          {/* Daily breakdown */}
                          <div className="space-y-1">
                            <p className="text-[10px] text-muted-foreground uppercase font-semibold">Daily Breakdown</p>
                            {last7.map((ci, i) => (
                              <div key={i} className="flex items-center justify-between py-1.5 border-b border-border last:border-0">
                                <div>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(ci.check_date + "T00:00:00").toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                                  </span>
                                  <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                                    ci.compliance === "at" ? "bg-green-500/15 text-green-500" :
                                    ci.compliance === "above" ? "bg-red-500/15 text-red-500" :
                                    "bg-yellow-500/15 text-yellow-500"
                                  }`}>
                                    {ci.compliance === "at" ? "✓" : ci.compliance === "above" ? "↑" : "↓"}
                                  </span>
                                </div>
                                {ci.actual_calories && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {ci.actual_calories}cal · {ci.actual_protein_g}p · {ci.actual_carbs_g}c · {ci.actual_fat_g}f
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                  </div>

                  {/* Weekly Adjustment Engine */}
                  <CoachReviewCard
                    clientUserId={selectedClient.user_id}
                    coachId={user.id}
                    clientWeights={clientWeights}
                    clientCheckIns={clientCheckIns}
                    currentMacros={clientMacros ? { calories: clientMacros.calories, protein_g: clientMacros.protein_g, carbs_g: clientMacros.carbs_g, fat_g: clientMacros.fat_g } : null}
                    clientGoal={selectedClient.goal}
                    clientGoalRate={selectedClient.goal_rate_lb_per_week}
                    onMacrosUpdated={(macros) => { setClientMacros({ ...macros, updated_at: new Date().toISOString() }); setMacroForm(macros); }}
                  />


                  <div className="flex gap-2">
                    <button onClick={() => setEditingMacros(true)}
                      className="flex-1 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors">
                      Adjust Macros
                    </button>
                    <button onClick={async () => {
                      if (!selectedClient || !user || !clientMacros) return;
                      setSaving(true);
                      await supabase.from("macro_targets").update({ set_by: user.id }).eq("user_id", selectedClient.user_id);
                      setClientMacros({ ...clientMacros, updated_at: new Date().toISOString() });
                      setSaving(false);
                      toast({ title: "Marked as reviewed — no changes" });
                    }} disabled={saving}
                      className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-bold text-sm hover:bg-secondary/80 transition-colors border border-border disabled:opacity-50">
                      {saving ? "Saving…" : "No Changes"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {section === "leads" && <LeadsTab />}

        {section === "standards" && <CoachStandardsManager />}

        {section === "import" && <ProgramImporter programs={programs} onImported={loadPrograms} />}

        {section === "export" && (
          <div className="p-6 max-w-4xl">
            <ProgramTableView onBack={() => setSection("programs")} />
          </div>
        )}

        {section === "billing" && (
          <div className="p-6 max-w-4xl">
            <h2 className="text-2xl font-black text-foreground mb-1">Subscription Billing</h2>
            <p className="text-sm text-muted-foreground mb-6">Manage pricing and view active subscribers.</p>

            {/* Active Subscriptions */}
            <div className="bg-card border border-border rounded-xl p-5 mb-6">
              <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-4">Active Subscriptions</p>
              {loadingSubs ? (
                <p className="text-sm text-muted-foreground">Loading…</p>
              ) : activeSubs.length === 0 ? (
                <p className="text-sm text-muted-foreground">No active subscriptions yet.</p>
              ) : (
                <>
                  <p className="text-3xl font-black text-foreground mb-4">{activeSubs.length} <span className="text-sm font-semibold text-muted-foreground">active subscriber{activeSubs.length !== 1 ? "s" : ""}</span></p>
                  <div className="overflow-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="text-left py-2 px-3 text-xs font-bold text-muted-foreground uppercase">Client</th>
                          <th className="text-left py-2 px-3 text-xs font-bold text-muted-foreground uppercase">Plan</th>
                          <th className="text-left py-2 px-3 text-xs font-bold text-muted-foreground uppercase">Billing</th>
                          <th className="text-left py-2 px-3 text-xs font-bold text-muted-foreground uppercase">Status</th>
                          <th className="text-left py-2 px-3 text-xs font-bold text-muted-foreground uppercase">Renews</th>
                          <th className="text-right py-2 px-3 text-xs font-bold text-muted-foreground uppercase">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeSubs.map((sub) => {
                          const tier = getTierFromProductId(sub.product_id);
                          const tierName = tier ? TIERS[tier].name : "Unknown";
                          const interval = sub.interval === "year" ? "Annual" : sub.interval === "month" ? "Monthly" : sub.interval;
                          const renewDate = sub.current_period_end ? new Date(sub.current_period_end).toLocaleDateString() : "—";
                          return (
                            <tr key={sub.subscription_id} className="border-b border-border/50 last:border-0">
                              <td className="py-3 px-3">
                                <p className="font-semibold text-foreground">{sub.customer_name || "—"}</p>
                                <p className="text-xs text-muted-foreground">{sub.customer_email || "—"}</p>
                              </td>
                              <td className="py-3 px-3">
                                <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${tier === "performance" ? "bg-primary/15 text-primary" : "bg-secondary text-foreground"}`}>
                                  {tierName}
                                </span>
                              </td>
                              <td className="py-3 px-3 text-foreground font-medium">{interval}</td>
                              <td className="py-3 px-3">
                                {sub.cancel_at_period_end ? (
                                  <span className="inline-block px-2 py-0.5 rounded text-xs font-bold bg-orange-500/15 text-orange-600">
                                    Cancelling
                                  </span>
                                ) : (
                                  <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold ${sub.status === "active" ? "bg-green-500/15 text-green-600" : "bg-yellow-500/15 text-yellow-600"}`}>
                                    {sub.status === "trialing" ? "Trial" : "Active"}
                                  </span>
                                )}
                              </td>
                              <td className="py-3 px-3 text-muted-foreground text-xs">{renewDate}</td>
                              <td className="py-3 px-3 text-right">
                                {sub.cancel_at_period_end ? (
                                  <span className="text-xs text-muted-foreground italic">Ends {renewDate}</span>
                                ) : (
                                  <button
                                    onClick={async () => {
                                      if (!confirm(`Cancel subscription for ${sub.customer_name || sub.customer_email}? They'll keep access until their current period ends.`)) return;
                                      const { data, error } = await supabase.functions.invoke("cancel-client-subscription", {
                                        body: { subscription_id: sub.subscription_id },
                                      });
                                      if (error || data?.error) {
                                        toast({ title: data?.error || "Failed to cancel", variant: "destructive" });
                                      } else {
                                        toast({ title: `Subscription cancelled for ${sub.customer_name || sub.customer_email}` });
                                        setLoadingSubs(true);
                                        const { data: refreshData } = await supabase.functions.invoke("list-subscriptions");
                                        if (refreshData?.subscriptions) setActiveSubs(refreshData.subscriptions);
                                        setLoadingSubs(false);
                                      }
                                    }}
                                    className="text-xs font-semibold text-destructive hover:text-destructive/80 transition-colors px-2 py-1 rounded-lg hover:bg-destructive/10"
                                  >
                                    Cancel
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Current Price */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border border-border rounded-xl p-5">
                <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase mb-2">Current Price</p>
                {subscriptionPrice ? (
                  <p className="text-4xl font-black text-foreground">
                    ${(subscriptionPrice / 100).toFixed(2)}
                    <span className="text-sm font-semibold text-muted-foreground">/month</span>
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">No price set yet</p>
                )}
              </div>

              {/* Update Price */}
              <div className="bg-card border border-border rounded-xl p-5 space-y-4">
                <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Set New Price</p>
                <div className="flex items-center gap-3">
                  <div className="relative flex-1">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="number"
                      inputMode="decimal"
                      step="0.01"
                      min="1"
                      placeholder="0.00"
                      value={newPrice}
                      onChange={e => setNewPrice(e.target.value)}
                      className="w-full bg-secondary border border-border rounded-lg pl-9 pr-3 py-3 text-lg font-bold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                    />
                  </div>
                  <span className="text-sm font-semibold text-muted-foreground">/mo</span>
                </div>
                <button
                  onClick={updateSubscriptionPrice}
                  disabled={savingPrice || !newPrice}
                  className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
                >
                  {savingPrice ? "Updating…" : "Update Subscription Price"}
                </button>
                <p className="text-[10px] text-muted-foreground">New clients will be charged this amount. Existing subscriptions remain at their current price.</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
