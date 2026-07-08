import { useState } from "react";
import { Calculator, Weight, ChevronRight, TrendingUp } from "lucide-react";
import { PlateCalculator } from "./PlateCalculator";
import { OneRepMaxCalculator } from "./OneRepMaxCalculator";
import { ProgressTab } from "../tabs/ProgressTab";

type Tool = "menu" | "plate" | "1rm" | "progress";

const TOOLS = [
  {
    id: "plate" as Tool,
    icon: "🏋️",
    title: "Plate Calculator",
    description: "See what plates to load on each side",
  },
  {
    id: "1rm" as Tool,
    icon: "💪",
    title: "1RM Calculator",
    description: "Estimate your one-rep max & save it",
  },
  {
    id: "progress" as Tool,
    icon: "📊",
    title: "Progress",
    description: "View your stats, strength PRs & trends",
  },
];

export function FitnessToolsTab() {
  const [activeTool, setActiveTool] = useState<Tool>("menu");

  if (activeTool === "plate") {
    return (
      <div className="px-4 pt-6 pb-24 space-y-4">
        <button
          onClick={() => setActiveTool("menu")}
          className="text-xs font-bold text-primary uppercase tracking-wider"
        >
          ← Back to Tools
        </button>
        <h2 className="text-2xl font-black text-foreground">Plate Calculator</h2>
        <PlateCalculator />
      </div>
    );
  }

  if (activeTool === "1rm") {
    return (
      <div className="px-4 pt-6 pb-24 space-y-4">
        <button
          onClick={() => setActiveTool("menu")}
          className="text-xs font-bold text-primary uppercase tracking-wider"
        >
          ← Back to Tools
        </button>
        <h2 className="text-2xl font-black text-foreground">1RM Calculator</h2>
        <OneRepMaxCalculator />
      </div>
    );
  }

  if (activeTool === "progress") {
    return (
      <div>
        <div className="px-4 pt-6 pb-4">
          <button
            onClick={() => setActiveTool("menu")}
            className="text-xs font-bold text-primary uppercase tracking-wider"
          >
            ← Back to Tools
          </button>
        </div>
        <ProgressTab />
      </div>
    );
  }

  return (
    <div className="px-4 pt-6 pb-24 space-y-5">
      <div>
        <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">
          Gym Bag
        </p>
        <h1 className="text-3xl font-black tracking-tight text-foreground mt-1">
          Fitness Tools
        </h1>
      </div>

      <div className="space-y-2">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(tool.id)}
            className="w-full flex items-center gap-4 bg-card border border-border rounded-2xl p-4 hover:border-primary/40 transition-colors"
          >
            <span className="text-3xl">{tool.icon}</span>
            <div className="flex-1 text-left">
              <p className="text-sm font-bold text-foreground">{tool.title}</p>
              <p className="text-xs text-muted-foreground">{tool.description}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          </button>
        ))}
      </div>
    </div>
  );
}
