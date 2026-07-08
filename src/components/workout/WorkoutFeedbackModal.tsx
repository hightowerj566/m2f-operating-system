import { useState } from "react";
import { X } from "lucide-react";

export type DifficultyRating = "easy" | "moderate" | "hard" | "very_hard";

interface FeedbackOption {
  value: DifficultyRating;
  emoji: string;
  label: string;
  description: string;
  responseMessage: string;
}

const FEEDBACK_OPTIONS: FeedbackOption[] = [
  {
    value: "easy",
    emoji: "💪",
    label: "Easy",
    description: "I had more in the tank",
    responseMessage: "Great work. We'll increase your recommended weight next session.",
  },
  {
    value: "moderate",
    emoji: "👊",
    label: "Moderate",
    description: "Right on target",
    responseMessage: "Perfect intensity. Stay on track.",
  },
  {
    value: "hard",
    emoji: "🔥",
    label: "Hard",
    description: "Pushed my limits",
    responseMessage: "Solid effort. We'll keep the weight the same next time.",
  },
  {
    value: "very_hard",
    emoji: "😤",
    label: "Very Hard",
    description: "Could not finish / too much",
    responseMessage: "Recovery matters. We'll slightly adjust next session.",
  },
];

interface WorkoutFeedbackModalProps {
  dayNumber: number;
  onSubmit: (difficulty: DifficultyRating) => void;
  onClose: () => void;
}

export function WorkoutFeedbackModal({ dayNumber, onSubmit, onClose }: WorkoutFeedbackModalProps) {
  const [selected, setSelected] = useState<DifficultyRating | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [responseMsg, setResponseMsg] = useState("");

  const handleSelect = (option: FeedbackOption) => {
    setSelected(option.value);
  };

  const handleSubmit = () => {
    if (!selected) return;
    const option = FEEDBACK_OPTIONS.find((o) => o.value === selected);
    setResponseMsg(option?.responseMessage || "");
    setSubmitted(true);
    onSubmit(selected);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-end justify-center" onClick={onClose}>
      <div
        className="w-full max-w-md bg-card border-t border-border rounded-t-3xl p-6 pb-8 space-y-5 animate-in slide-in-from-bottom"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="w-8" />
          <div className="w-10 h-1 rounded-full bg-border" />
          <button onClick={onClose} className="p-1 text-muted-foreground hover:text-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitted ? (
          <div className="text-center space-y-4 py-4">
            <span className="text-5xl">✅</span>
            <h2 className="text-xl font-black text-foreground">Workout Complete!</h2>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">{responseMsg}</p>
            <button
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="text-center space-y-1">
              <h2 className="text-xl font-black text-foreground">How was your workout?</h2>
              <p className="text-sm text-muted-foreground">Day {dayNumber} — Rate the difficulty</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {FEEDBACK_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  onClick={() => handleSelect(option)}
                  className={`flex flex-col items-center gap-1.5 p-4 rounded-2xl border-2 transition-all ${
                    selected === option.value
                      ? "border-primary bg-primary/10"
                      : "border-border bg-secondary/50 hover:border-primary/30"
                  }`}
                >
                  <span className="text-3xl">{option.emoji}</span>
                  <span className="text-sm font-bold text-foreground">{option.label}</span>
                  <span className="text-[11px] text-muted-foreground leading-tight text-center">{option.description}</span>
                </button>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!selected}
              className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Submit Feedback
            </button>
          </>
        )}
      </div>
    </div>
  );
}
