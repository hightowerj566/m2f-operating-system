// M2F OS · First-login Essentials.
// Only the fatherhood essentials. No fitness questions here — those live in
// /training-profile and are collected the first time a member opens Training.
// If a funnel lead exists for this email (father_athlete_leads), we hydrate the
// due date and materialize the readiness assessment so it isn't asked twice.

import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { ChevronRight } from "lucide-react";
import m2fLogo from "@/assets/m2f-logo.png.asset.json";
import { CATEGORIES, scoreAssessment, type AssessmentQuestion } from "@/lib/readiness";
import { useAssessmentQuestions } from "@/hooks/useReadiness";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export default function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: questions = [] } = useAssessmentQuestions();

  const [firstName, setFirstName] = useState("");
  const [partnerName, setPartnerName] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [babyName, setBabyName] = useState("");
  const [saving, setSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);
  const [dueLocked, setDueLocked] = useState(false); // true if funnel already gave us one

  // Hydrate from an existing lead (funnel completion) or existing profile
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data: profile } = await db
        .from("profiles")
        .select("display_name, partner_name, due_date, baby_name")
        .eq("user_id", user.id)
        .maybeSingle();
      if (profile?.display_name && !/@/.test(profile.display_name)) setFirstName(profile.display_name);
      if (profile?.partner_name) setPartnerName(profile.partner_name);
      if (profile?.due_date) { setDueDate(profile.due_date); setDueLocked(true); }
      if (profile?.baby_name) setBabyName(profile.baby_name);

      // Look for a matching funnel lead (email match) and hydrate what's missing
      if (!profile?.due_date && user.email) {
        const { data: lead } = await db
          .from("father_athlete_leads")
          .select("name, due_date, quiz_answers, total_score, category_scores")
          .eq("email", user.email)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (lead) {
          if (lead.due_date) { setDueDate(lead.due_date); setDueLocked(true); }
          if (!profile?.display_name && lead.name) setFirstName(String(lead.name).split(" ")[0]);
        }
      }
      setHydrated(true);
    })();
  }, [user]);

  if (loading || !hydrated) {
    return (
      <div className="flex items-center justify-center min-h-dvh bg-background">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/auth" replace />;

  const canSubmit = firstName.trim() && dueDate;

  /** If a funnel lead exists for this email, materialize it into assessments/scores so Home
   *  reflects the readiness score without ever asking again. */
  const importLeadAssessment = async () => {
    if (!user.email || !questions.length) return;
    // Already has an assessment? skip.
    const { data: existing } = await db
      .from("assessments")
      .select("id")
      .eq("user_id", user.id)
      .limit(1);
    if (existing && existing.length > 0) return;

    const { data: lead } = await db
      .from("father_athlete_leads")
      .select("total_score, category_scores, quiz_answers, due_date")
      .eq("email", user.email)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (!lead) return;

    // Prefer stored points; fall back to recomputing from labels+questions
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const answers: any = lead.quiz_answers ?? {};
    let total = Number(lead.total_score ?? 0);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let byCategory: Record<string, number> | null = (lead.category_scores as any) ?? null;
    if (!byCategory && answers.points) {
      const result = scoreAssessment(answers.points, questions as AssessmentQuestion[]);
      total = result.total;
      byCategory = result.byCategory;
    }

    const { data: inserted } = await db
      .from("assessments")
      .insert({ user_id: user.id, total_score: total, weeks_remaining: null, answers })
      .select("id")
      .single();
    if (!inserted || !byCategory) return;

    const rows = CATEGORIES
      .filter((c) => byCategory![c.slug] != null)
      .map((c) => ({ assessment_id: inserted.id, category_id: c.id, score: byCategory![c.slug] }));
    if (rows.length) await db.from("assessment_category_scores").insert(rows);
    await db.from("profiles").update({ last_assessment_id: inserted.id }).eq("user_id", user.id);
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSaving(true);
    try {
      const { error } = await db
        .from("profiles")
        .update({
          display_name: firstName.trim(),
          partner_name: partnerName.trim() || null,
          due_date: dueDate,
          baby_name: babyName.trim() || null,
          onboarding_complete: true,
        })
        .eq("user_id", user.id);
      if (error) throw error;

      await importLeadAssessment();

      toast({ title: `Welcome, ${firstName.trim()}.`, description: "The clock is running." });
      navigate("/", { replace: true });
    } catch (err) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      toast({ title: "Couldn't save", description: (err as any)?.message ?? "Try again.", variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-dvh bg-background flex flex-col pt-safe pb-safe">
      <div className="flex-1 flex flex-col justify-center px-6 max-w-md mx-auto w-full">
        <div className="flex flex-col items-center mb-8">
          <img src={m2fLogo.url} alt="M2F" className="w-32 h-32 object-contain" />
          <p className="text-[11px] font-bold tracking-[0.28em] uppercase text-primary mt-2">Man to Father</p>
          <h1 className="text-3xl font-black text-foreground text-center mt-4 leading-tight">
            The clock is running.
          </h1>
          <p className="text-sm text-muted-foreground text-center mt-2">
            Four quick things and you're in.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <Label className="text-foreground">Your first name</Label>
            <Input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              autoComplete="given-name"
              placeholder="What should we call you?"
              className="mt-1 bg-card border-border text-foreground"
            />
          </div>

          <div>
            <Label className="text-foreground">Partner's name</Label>
            <Input
              type="text"
              value={partnerName}
              onChange={(e) => setPartnerName(e.target.value)}
              placeholder="Her name"
              className="mt-1 bg-card border-border text-foreground"
            />
          </div>

          <div>
            <Label className="text-foreground">
              Due date {dueLocked && <span className="text-xs text-muted-foreground font-normal">· from your assessment</span>}
            </Label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="mt-1 bg-card border-border text-foreground"
            />
          </div>

          <div>
            <Label className="text-foreground">
              Baby name <span className="text-xs text-muted-foreground font-normal">(optional)</span>
            </Label>
            <Input
              type="text"
              value={babyName}
              onChange={(e) => setBabyName(e.target.value)}
              placeholder="If you've picked one"
              className="mt-1 bg-card border-border text-foreground"
            />
          </div>
        </div>

        <Button
          onClick={handleSubmit}
          disabled={!canSubmit || saving}
          className="w-full mt-8 h-12 rounded-xl font-black text-sm tracking-wide"
        >
          {saving ? "Setting up..." : "Enter the app"} <ChevronRight className="ml-1 w-4 h-4" />
        </Button>

        <p className="text-xs text-muted-foreground text-center mt-4">
          Training and nutrition set up later — only when you need them.
        </p>
      </div>
    </div>
  );
}
