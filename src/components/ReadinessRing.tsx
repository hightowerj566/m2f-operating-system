// M2F OS · The Readiness Ring — total /70 with 7 category segments.
// Pure SVG, theme-token colors, animated count-up on mount.

import { useEffect, useState } from "react";
import { CATEGORIES, type CategorySlug } from "@/lib/readiness";

interface ReadinessRingProps {
  total: number; // /70
  byCategory?: Record<CategorySlug, number>; // each /10
  size?: number;
  onSegmentClick?: (slug: CategorySlug) => void;
}

const TAU = Math.PI * 2;

function arcPath(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const sx = cx + r * Math.cos(startAngle);
  const sy = cy + r * Math.sin(startAngle);
  const ex = cx + r * Math.cos(endAngle);
  const ey = cy + r * Math.sin(endAngle);
  const largeArc = endAngle - startAngle > Math.PI ? 1 : 0;
  return `M ${sx} ${sy} A ${r} ${r} 0 ${largeArc} 1 ${ex} ${ey}`;
}

export function ReadinessRing({ total, byCategory, size = 220, onSegmentClick }: ReadinessRingProps) {
  const [displayTotal, setDisplayTotal] = useState(0);

  useEffect(() => {
    let frame: number;
    const start = performance.now();
    const duration = 1200;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayTotal(Math.round(eased * total));
      if (t < 1) frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [total]);

  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - 16;
  const gap = 0.06;
  const segAngle = TAU / 7 - gap;
  const startOffset = -Math.PI / 2;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        {CATEGORIES.map((cat, i) => {
          const a0 = startOffset + i * (segAngle + gap);
          const a1 = a0 + segAngle;
          const score = byCategory ? byCategory[cat.slug] : Math.round(total / 7);
          const fillRatio = Math.max(0.02, Math.min(1, score / 10));
          return (
            <g
              key={cat.slug}
              onClick={onSegmentClick ? () => onSegmentClick(cat.slug) : undefined}
              className={onSegmentClick ? "cursor-pointer" : undefined}
            >
              <path
                d={arcPath(cx, cy, r, a0, a1)}
                fill="none"
                stroke="hsl(var(--border))"
                strokeWidth={12}
                strokeLinecap="round"
              />
              <path
                d={arcPath(cx, cy, r, a0, a0 + segAngle * fillRatio)}
                fill="none"
                stroke="hsl(var(--primary))"
                strokeWidth={12}
                strokeLinecap="round"
              />
            </g>
          );
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-5xl font-black tracking-tight text-foreground leading-none">{displayTotal}</span>
        <span className="text-xs font-bold tracking-[0.25em] text-muted-foreground mt-1">/ 70</span>
        <span className="text-[10px] font-semibold tracking-[0.2em] uppercase text-primary mt-1">Readiness</span>
      </div>
    </div>
  );
}
