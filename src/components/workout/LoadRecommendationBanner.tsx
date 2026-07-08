import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import type { LoadRecommendation } from "@/lib/adaptiveEngine";

interface LoadRecommendationBannerProps {
  recommendations: LoadRecommendation[];
}

export function LoadRecommendationBanner({ recommendations }: LoadRecommendationBannerProps) {
  const meaningful = recommendations.filter((r) => r.lastWeight || r.adjustmentNote);
  if (meaningful.length === 0) return null;

  return (
    <div className="mx-1 mb-4 space-y-2">
      <p className="text-[10px] font-bold tracking-widest text-primary uppercase px-1">
        Adaptive Recommendations
      </p>
      <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 space-y-2.5">
        {meaningful.map((rec) => (
          <div key={rec.exerciseName} className="flex items-start gap-3">
            <div className="mt-0.5">
              {rec.recommendedWeight && rec.lastWeight && rec.recommendedWeight > rec.lastWeight ? (
                <TrendingUp className="w-4 h-4 text-primary" />
              ) : rec.repsAdjustment < 0 || rec.setsAdjustment < 0 ? (
                <TrendingDown className="w-4 h-4 text-destructive" />
              ) : (
                <Minus className="w-4 h-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-foreground">{rec.exerciseName}</p>
              <div className="flex items-center gap-2 mt-0.5">
                {rec.recommendedWeight ? (
                  <span className="text-xs font-semibold text-primary">
                    Recommended: {rec.recommendedWeight} lbs
                  </span>
                ) : null}
                {rec.lastWeight ? (
                  <span className="text-[11px] text-muted-foreground">
                    (Last: {rec.lastWeight} lbs)
                  </span>
                ) : null}
              </div>
              {rec.adjustmentNote && (
                <p className="text-[11px] text-muted-foreground mt-0.5">{rec.adjustmentNote}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
