import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { Plus, Trash2, Save, GripVertical, Users, UserCircle } from "lucide-react";

interface StandardDef {
  id: string;
  key: string;
  label: string;
  emoji: string;
  is_global: boolean;
  target_user_id: string | null;
  is_active: boolean;
  sort_order: number;
}

interface ClientProfile {
  user_id: string;
  display_name: string | null;
}

export function CoachStandardsManager() {
  const { user } = useAuth();
  const [standards, setStandards] = useState<StandardDef[]>([]);
  const [clients, setClients] = useState<ClientProfile[]>([]);
  const [selectedClient, setSelectedClient] = useState<string | null>(null); // null = global
  const [newLabel, setNewLabel] = useState("");
  const [newEmoji, setNewEmoji] = useState("✅");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadAll();
  }, [user]);

  const loadAll = async () => {
    const [{ data: stds }, { data: cls }] = await Promise.all([
      supabase.from("standard_definitions").select("*").order("sort_order"),
      supabase.from("profiles").select("user_id, display_name"),
    ]);
    if (stds) setStandards(stds as any[]);
    if (cls) setClients(cls as any[]);
  };

  const filteredStandards = standards.filter((s) => {
    if (selectedClient === null) return s.is_global && s.target_user_id === null;
    return s.target_user_id === selectedClient;
  });

  const addStandard = async () => {
    if (!user || !newLabel.trim()) return;
    setSaving(true);
    const key = newLabel.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    const { error } = await supabase.from("standard_definitions").insert({
      key,
      label: newLabel.trim(),
      emoji: newEmoji || "✅",
      is_global: selectedClient === null,
      created_by: user.id,
      target_user_id: selectedClient,
      sort_order: filteredStandards.length,
    } as any);
    setSaving(false);
    if (error) {
      toast({ title: "Failed to add standard", variant: "destructive" });
    } else {
      setNewLabel("");
      setNewEmoji("✅");
      loadAll();
      toast({ title: `Added "${newLabel.trim()}"` });
    }
  };

  const toggleActive = async (std: StandardDef) => {
    await supabase
      .from("standard_definitions")
      .update({ is_active: !std.is_active } as any)
      .eq("id", std.id);
    setStandards((prev) =>
      prev.map((s) => (s.id === std.id ? { ...s, is_active: !s.is_active } : s))
    );
  };

  const deleteStandard = async (id: string) => {
    await supabase.from("standard_definitions").delete().eq("id", id);
    setStandards((prev) => prev.filter((s) => s.id !== id));
    toast({ title: "Standard removed" });
  };

  const seedDefaults = async () => {
    if (!user) return;
    setSaving(true);
    const defaults = [
      { key: "wake_on_time", label: "Wake On Time", emoji: "⏰", sort_order: 0 },
      { key: "workout_completed", label: "Train", emoji: "🏋️", sort_order: 1 },
      { key: "protein_hit", label: "Hit Protein", emoji: "🥩", sort_order: 2 },
      { key: "steps_hit", label: "Hit Steps", emoji: "🚶", sort_order: 3 },
      { key: "scripture_read", label: "Read / Pray", emoji: "📖", sort_order: 4 },
      { key: "family_time", label: "Family Time", emoji: "👨‍👧‍👦", sort_order: 5 },
      { key: "no_phone_at_dinner", label: "No Phone at Dinner", emoji: "📵", sort_order: 6 },
      { key: "hydration_hit", label: "Hydration", emoji: "💧", sort_order: 7 },
    ];
    for (const d of defaults) {
      await supabase.from("standard_definitions").insert({
        ...d,
        is_global: true,
        created_by: user.id,
        target_user_id: null,
      } as any);
    }
    setSaving(false);
    loadAll();
    toast({ title: "Default standards created" });
  };

  return (
    <div className="p-6 max-w-3xl space-y-6">
      <div>
        <h2 className="text-2xl font-black text-foreground mb-1">Daily Standards</h2>
        <p className="text-sm text-muted-foreground">
          Manage non-negotiable daily habits. Global standards apply to all clients.
        </p>
      </div>

      {/* Scope Selector */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setSelectedClient(null)}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
            selectedClient === null
              ? "bg-primary text-primary-foreground"
              : "bg-secondary text-muted-foreground hover:text-foreground"
          }`}
        >
          <Users className="w-4 h-4" /> Global (All Clients)
        </button>
        {clients
          .filter((c) => c.user_id !== user?.id)
          .map((c) => (
            <button
              key={c.user_id}
              onClick={() => setSelectedClient(c.user_id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                selectedClient === c.user_id
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              <UserCircle className="w-4 h-4" /> {c.display_name || "Client"}
            </button>
          ))}
      </div>

      {/* Seed defaults if empty */}
      {selectedClient === null && filteredStandards.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-6 text-center space-y-3">
          <p className="text-sm text-muted-foreground">
            No global standards defined yet. Start with the recommended defaults?
          </p>
          <button
            onClick={seedDefaults}
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            {saving ? "Creating..." : "Create Default Standards"}
          </button>
        </div>
      )}

      {/* Standards List */}
      {filteredStandards.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase px-1 mb-2">
            {selectedClient === null ? "Global Standards" : `Standards for ${clients.find((c) => c.user_id === selectedClient)?.display_name || "Client"}`}
          </p>
          {filteredStandards.map((std) => (
            <div
              key={std.id}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                std.is_active ? "bg-secondary/50" : "bg-secondary/20 opacity-50"
              }`}
            >
              <GripVertical className="w-3.5 h-3.5 text-muted-foreground/40 shrink-0" />
              <span className="text-lg">{std.emoji}</span>
              <span className="text-sm font-semibold text-foreground flex-1">{std.label}</span>
              <button
                onClick={() => toggleActive(std)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold uppercase ${
                  std.is_active
                    ? "bg-primary/10 text-primary"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {std.is_active ? "Active" : "Disabled"}
              </button>
              <button
                onClick={() => deleteStandard(std.id)}
                className="text-destructive/60 hover:text-destructive transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Add New Standard */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase px-1">
          Add New Standard
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            value={newEmoji}
            onChange={(e) => setNewEmoji(e.target.value)}
            className="w-14 bg-secondary border border-border rounded-xl px-2 py-2.5 text-center text-lg focus:outline-none focus:border-primary"
            maxLength={2}
          />
          <input
            type="text"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            placeholder="e.g. Cold Shower, Journal, Read 10 Pages..."
            className="flex-1 bg-secondary border border-border rounded-xl px-4 py-2.5 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
          />
          <button
            onClick={addStandard}
            disabled={!newLabel.trim() || saving}
            className="px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
