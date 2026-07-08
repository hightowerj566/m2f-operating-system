import { X } from "lucide-react";

interface DayPickerModalProps {
  totalDays: number;
  currentDay: number;
  onSelect: (day: number) => void;
  onClose: () => void;
}

export function DayPickerModal({ totalDays, currentDay, onSelect, onClose }: DayPickerModalProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl p-5 mx-4" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-black text-foreground">Select Day</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-5 h-5" /></button>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Choose which day of your program you're on.</p>
        <div className="grid grid-cols-7 gap-1.5 max-h-64 overflow-y-auto">
          {Array.from({ length: totalDays }, (_, i) => i + 1).map(day => (
            <button key={day} onClick={() => { onSelect(day); onClose(); }}
              className={`aspect-square flex items-center justify-center rounded-lg text-xs font-bold transition-all ${day === currentDay ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"}`}>
              {day}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
