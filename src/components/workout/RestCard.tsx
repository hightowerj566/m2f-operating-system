import { Timer } from "lucide-react";

export function RestCard({ detail, onTap }: { detail: string; seconds: number; onTap: () => void }) {
  return (
    <button onClick={onTap}
      className="w-full flex items-center gap-3 bg-card border border-border rounded-xl p-3 hover:border-primary/30 active:scale-[0.98] transition-all text-left">
      <div className="w-16 h-16 rounded-lg bg-secondary flex-shrink-0 flex items-center justify-center">
        <Timer className="w-7 h-7 text-muted-foreground" />
      </div>
      <div className="flex-1">
        <p className="font-bold text-sm text-foreground">REST</p>
        <p className="text-xs text-muted-foreground mt-0.5">{detail}</p>
      </div>
      <span className="text-[10px] font-semibold text-primary border border-primary/30 rounded-md px-2 py-1 flex-shrink-0">START</span>
    </button>
  );
}
