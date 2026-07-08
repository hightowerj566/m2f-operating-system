import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search, Mail, Phone, User, Calendar, TrendingUp, Users, Target, BarChart3 } from "lucide-react";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  archetype_type: string;
  quiz_answers: any;
  source: string;
  created_at: string;
}

const ARCHETYPE_COLORS: Record<string, string> = {
  "Former Athlete": "bg-blue-500/20 text-blue-400 border-blue-500/30",
  "Overworked Provider": "bg-amber-500/20 text-amber-400 border-amber-500/30",
  "Inconsistent Grinder": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "Restarting Leader": "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
};

// Map archetypes to recommended program
const ARCHETYPE_TO_PROGRAM: Record<string, string> = {
  "Former Athlete": "M2F Perform",
  "Overworked Provider": "M2F Rebuild",
  "Inconsistent Grinder": "M2F Rebuild",
  "Restarting Leader": "M2F Rebuild",
};

export function LeadsTab() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState<string>("all");

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    const { data, error } = await supabase
      .from("father_athlete_leads")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error && data) setLeads(data);
    setLoading(false);
  };

  const filtered = leads.filter((l) => {
    const matchesSearch =
      !search ||
      l.name.toLowerCase().includes(search.toLowerCase()) ||
      l.email.toLowerCase().includes(search.toLowerCase()) ||
      l.phone.includes(search);
    const matchesType = filterType === "all" || l.archetype_type === filterType;
    return matchesSearch && matchesType;
  });

  const archetypes = ["all", "Former Athlete", "Overworked Provider", "Inconsistent Grinder", "Restarting Leader"];

  const counts = leads.reduce<Record<string, number>>((acc, l) => {
    acc[l.archetype_type] = (acc[l.archetype_type] || 0) + 1;
    return acc;
  }, {});

  // Program breakdown
  const programCounts = useMemo(() => {
    const map: Record<string, number> = { "M2F Rebuild": 0, "M2F Perform": 0 };
    leads.forEach((l) => {
      const prog = ARCHETYPE_TO_PROGRAM[l.archetype_type] || "M2F Rebuild";
      map[prog] = (map[prog] || 0) + 1;
    });
    return map;
  }, [leads]);

  // Time-based metrics
  const timeMetrics = useMemo(() => {
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    const monthAgo = new Date(now);
    monthAgo.setDate(monthAgo.getDate() - 30);

    const todayCount = leads.filter((l) => l.created_at.startsWith(today)).length;
    const weekCount = leads.filter((l) => new Date(l.created_at) >= weekAgo).length;
    const monthCount = leads.filter((l) => new Date(l.created_at) >= monthAgo).length;

    return { todayCount, weekCount, monthCount };
  }, [leads]);

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h2 className="text-2xl font-black text-foreground mb-1">Quiz Leads & Conversion</h2>
        <p className="text-sm text-muted-foreground">
          {leads.length} total lead{leads.length !== 1 ? "s" : ""} captured from the Father-Athlete quiz.
        </p>
      </div>

      {/* Conversion Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-3.5 h-3.5 text-primary" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Total Leads</p>
          </div>
          <p className="text-2xl font-black text-foreground">{leads.length}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-primary" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase">Today</p>
          </div>
          <p className="text-2xl font-black text-foreground">{timeMetrics.todayCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2 mb-1">
            <BarChart3 className="w-3.5 h-3.5 text-primary" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase">This Week</p>
          </div>
          <p className="text-2xl font-black text-foreground">{timeMetrics.weekCount}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-3">
          <div className="flex items-center gap-2 mb-1">
            <Target className="w-3.5 h-3.5 text-primary" />
            <p className="text-[10px] font-bold text-muted-foreground uppercase">This Month</p>
          </div>
          <p className="text-2xl font-black text-foreground">{timeMetrics.monthCount}</p>
        </div>
      </div>

      {/* Program Split */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {(["M2F Rebuild", "M2F Perform"] as const).map((prog) => {
          const count = programCounts[prog] || 0;
          const pct = leads.length > 0 ? Math.round((count / leads.length) * 100) : 0;
          return (
            <div key={prog} className="rounded-xl border border-border bg-card p-4">
              <p className="text-xs font-bold text-muted-foreground uppercase mb-1">{prog}</p>
              <div className="flex items-end gap-2">
                <p className="text-3xl font-black text-foreground">{count}</p>
                <p className="text-sm font-semibold text-muted-foreground mb-1">({pct}%)</p>
              </div>
              <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary rounded-full transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Archetype filter cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {archetypes.slice(1).map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(filterType === type ? "all" : type)}
            className={`rounded-xl border p-3 text-left transition-all ${
              filterType === type
                ? "border-primary bg-primary/10"
                : "border-border bg-card hover:border-primary/50"
            }`}
          >
            <p className="text-xs font-bold text-muted-foreground uppercase truncate">{type}</p>
            <p className="text-2xl font-black text-foreground">{counts[type] || 0}</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email, or phone…"
          className="w-full bg-secondary border border-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
        />
      </div>

      {/* Leads list */}
      {loading ? (
        <div className="text-center py-12 text-muted-foreground text-sm">Loading leads…</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground text-sm">
          {leads.length === 0 ? "No leads yet. Share your quiz link to start capturing leads." : "No leads match your filter."}
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((lead) => {
            const recommendedProgram = ARCHETYPE_TO_PROGRAM[lead.archetype_type] || "M2F Rebuild";
            return (
              <div
                key={lead.id}
                className="bg-card border border-border rounded-xl p-4 flex flex-col md:flex-row md:items-center gap-3"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <User className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span className="font-bold text-foreground truncate">{lead.name}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        ARCHETYPE_COLORS[lead.archetype_type] || "bg-secondary text-foreground border-border"
                      }`}
                    >
                      {lead.archetype_type}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-primary/30 bg-primary/10 text-primary">
                      {recommendedProgram}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="w-3 h-3" /> {lead.email}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3" /> {lead.phone}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {new Date(lead.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
