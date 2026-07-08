import { useState } from "react";

type PlateSystem = "olympic" | "metric";

const OLYMPIC_PLATES = [45, 35, 25, 10, 5, 2.5];
const METRIC_PLATES = [25, 20, 15, 10, 5, 2.5, 1.25];
const OLYMPIC_BAR = 45;
const METRIC_BAR = 20; // kg

function calculatePlates(targetWeight: number, system: PlateSystem): { plates: { weight: number; count: number }[]; remainder: number } {
  const barWeight = system === "olympic" ? OLYMPIC_BAR : METRIC_BAR;
  const availablePlates = system === "olympic" ? OLYMPIC_PLATES : METRIC_PLATES;

  if (targetWeight <= barWeight) return { plates: [], remainder: 0 };

  let perSide = (targetWeight - barWeight) / 2;
  const plates: { weight: number; count: number }[] = [];

  for (const plate of availablePlates) {
    if (perSide >= plate) {
      const count = Math.floor(perSide / plate);
      plates.push({ weight: plate, count });
      perSide -= count * plate;
    }
  }

  return { plates, remainder: Math.round(perSide * 100) / 100 };
}

export function PlateCalculator() {
  const [weight, setWeight] = useState("");
  const [system, setSystem] = useState<PlateSystem>("olympic");

  const targetWeight = parseFloat(weight) || 0;
  const barWeight = system === "olympic" ? OLYMPIC_BAR : METRIC_BAR;
  const unit = system === "olympic" ? "lbs" : "kg";
  const { plates, remainder } = calculatePlates(targetWeight, system);

  return (
    <div className="space-y-4">
      {/* System Toggle */}
      <div className="flex gap-1 bg-secondary rounded-lg p-0.5">
        {(["olympic", "metric"] as PlateSystem[]).map((s) => (
          <button
            key={s}
            onClick={() => setSystem(s)}
            className={`flex-1 px-3 py-2 text-xs font-bold uppercase rounded-md transition-colors ${
              system === s
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "olympic" ? `Olympic (${OLYMPIC_BAR} lb bar)` : `Metric (${METRIC_BAR} kg bar)`}
          </button>
        ))}
      </div>

      {/* Weight Input */}
      <div>
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Target Weight ({unit})
        </label>
        <input
          type="number"
          value={weight}
          onChange={(e) => setWeight(e.target.value)}
          placeholder={system === "olympic" ? "185" : "100"}
          className="w-full mt-1 px-4 py-3 rounded-xl bg-secondary border border-border text-foreground text-lg font-bold placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
        />
      </div>

      {/* Result */}
      {targetWeight > barWeight && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
          <div className="text-center space-y-1">
            <p className="text-xs font-bold text-muted-foreground uppercase">Each Side</p>
            <p className="text-sm text-muted-foreground">
              Bar: {barWeight} {unit} + {((targetWeight - barWeight) / 2).toFixed(1)} {unit} per side
            </p>
          </div>

          {plates.length > 0 ? (
            <div className="space-y-2">
              {plates.map((p) => (
                <div
                  key={p.weight}
                  className="flex items-center justify-between bg-secondary/50 rounded-xl px-4 py-3"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`rounded-lg flex items-center justify-center font-black text-primary-foreground ${
                        p.weight >= 45
                          ? "w-12 h-12 bg-primary text-lg"
                          : p.weight >= 25
                          ? "w-10 h-10 bg-primary/80 text-base"
                          : p.weight >= 10
                          ? "w-8 h-8 bg-primary/60 text-sm"
                          : "w-7 h-7 bg-primary/40 text-xs"
                      }`}
                    >
                      {p.weight}
                    </div>
                    <span className="text-sm font-semibold text-foreground">
                      {p.weight} {unit} plate
                    </span>
                  </div>
                  <span className="text-lg font-black text-primary">×{p.count}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center">Just the bar!</p>
          )}

          {remainder > 0 && (
            <p className="text-xs text-destructive text-center">
              ⚠️ {remainder} {unit} remaining cannot be loaded with standard plates
            </p>
          )}
        </div>
      )}

      {targetWeight > 0 && targetWeight <= barWeight && (
        <p className="text-sm text-muted-foreground text-center py-4">
          Target weight is equal to or less than the bar ({barWeight} {unit})
        </p>
      )}
    </div>
  );
}
