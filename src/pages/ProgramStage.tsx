// M2F OS · Stage overview page. The "why" behind the current training block.

import { Navigate, useNavigate, useParams } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { stageBySlug } from "@/content/journeyStages";

const ROWS: Array<{ key: keyof ReturnType<typeof stageBySlug> extends infer T ? T extends null ? never : keyof NonNullable<T> : never; label: string }> = [
  { key: "purpose", label: "Purpose" },
  { key: "frequency", label: "Frequency" },
  { key: "split", label: "Weekly split" },
  { key: "progressionRule", label: "Progression" },
  { key: "nutrition", label: "Nutrition" },
  { key: "recovery", label: "Recovery" },
  { key: "outcome", label: "Expected outcome" },
  { key: "duration", label: "Duration" },
];

export default function ProgramStage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { slug = "" } = useParams();
  const stage = stageBySlug(slug);

  if (loading) return null;
  if (!user) return <Navigate to="/auth" replace />;

  return (
    <div className="min-h-dvh bg-background text-foreground max-w-md mx-auto px-5 pt-[calc(1.5rem+env(safe-area-inset-top))] pb-[calc(4rem+env(safe-area-inset-bottom))]">
      <button
        onClick={() => navigate("/programs")}
        className="text-sm text-muted-foreground flex items-center gap-1 hover:text-foreground transition-colors mb-6"
      >
        <ChevronLeft className="w-4 h-4" /> Programs
      </button>

      {!stage ? (
        <div>
          <h1 className="text-2xl font-black tracking-tight mb-2">Stage not found</h1>
        </div>
      ) : (
        <>
          <p className="text-xs font-bold tracking-[0.3em] uppercase text-primary mb-1">
            {stage.era === "pregnancy" ? "Pregnancy" : "Father Mode"} · {stage.window}
          </p>
          <h1 className="text-4xl font-black tracking-tight mb-6">{stage.name}</h1>

          <div className="space-y-3">
            {ROWS.map((row) => (
              <div key={row.key as string} className="rounded-xl border border-border bg-card/60 p-4">
                <p className="text-[10px] font-bold tracking-[0.24em] uppercase text-muted-foreground mb-1">
                  {row.label}
                </p>
                <p className="text-sm text-foreground/85">{stage[row.key as keyof typeof stage] as string}</p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
