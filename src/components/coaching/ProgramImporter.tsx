import { useState, useRef } from "react";
import { Upload, FileJson, ChevronDown, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

interface Program {
  id: string;
  name: string;
  total_days: number;
}

interface ImportResult {
  success: boolean;
  program_id?: string;
  total_days_imported?: number;
  start_day?: number;
  end_day?: number;
  results?: string[];
  error?: string;
}

export function ProgramImporter({
  programs,
  onImported,
}: {
  programs: Program[];
  onImported: () => void;
}) {
  const [mode, setMode] = useState<"new" | "extend">("new");
  const [programName, setProgramName] = useState("");
  const [selectedProgramId, setSelectedProgramId] = useState("");
  const [startDay, setStartDay] = useState(1);
  const [daysPerWeek, setDaysPerWeek] = useState(7);
  const [jsonData, setJsonData] = useState<any>(null);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      setJsonData(parsed);
      setFileName(file.name);

      // Auto-fill program name from meta
      if (parsed.meta?.program) {
        setProgramName(parsed.meta.program + (parsed.meta.phase_name ? ` — ${parsed.meta.phase_name}` : ""));
      }

      // Auto-detect days per week from first week
      const firstMeso = parsed.mesocycles?.[0];
      const firstWeek = firstMeso?.weeks?.[0];
      if (firstWeek?.days?.length) {
        // Training days + rest/recovery days
        const trainingDays = firstWeek.days.length;
        if (trainingDays <= 5) setDaysPerWeek(7);
        else setDaysPerWeek(trainingDays + 2);
      }

      setResult(null);
      toast({ title: "JSON loaded", description: `${file.name} parsed successfully` });
    } catch {
      toast({ title: "Invalid JSON file", variant: "destructive" });
    }
  };

  const handleImport = async () => {
    if (!jsonData) return;
    setImporting(true);
    setResult(null);

    try {
      const body: any = {
        program_json: jsonData,
        days_per_week: daysPerWeek,
      };

      if (mode === "new") {
        body.create_program = true;
        body.program_name = programName || "Imported Program";
        body.start_day = 1;
      } else {
        body.program_id = selectedProgramId;
        body.create_program = false;
        body.start_day = startDay;
      }

      const { data, error } = await supabase.functions.invoke("import-program-v4", { body });

      if (error) throw new Error(error.message);
      if (data?.error) throw new Error(data.error);

      setResult(data);
      onImported();
      toast({ title: "Import successful!", description: `${data.total_days_imported} days imported` });
    } catch (err: any) {
      setResult({ success: false, error: err.message });
      toast({ title: "Import failed", description: err.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const selectedProgram = programs.find(p => p.id === selectedProgramId);

  return (
    <div className="p-6 max-w-2xl">
      <h2 className="text-2xl font-black text-foreground mb-1">Import Program</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Upload a JSON file to create a new program or extend an existing one.
      </p>

      {/* File Upload */}
      <div className="mb-6">
        <input
          ref={fileRef}
          type="file"
          accept=".json"
          className="hidden"
          onChange={e => { if (e.target.files?.[0]) handleFileSelect(e.target.files[0]); }}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className={`w-full py-8 border-2 border-dashed rounded-xl flex flex-col items-center gap-3 transition-colors ${
            jsonData
              ? "border-primary/40 bg-primary/5"
              : "border-border hover:border-primary/30 hover:bg-secondary/50"
          }`}
        >
          {jsonData ? (
            <>
              <FileJson className="w-8 h-8 text-primary" />
              <div className="text-center">
                <p className="text-sm font-bold text-foreground">{fileName}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {jsonData.meta?.program || "Program"} • {jsonData.mesocycles?.length || 0} mesocycles •{" "}
                  {jsonData.mesocycles?.reduce((s: number, m: any) => s + (m.weeks?.length || 0), 0) || 0} weeks
                </p>
                <p className="text-xs text-primary mt-1 font-semibold">Click to change file</p>
              </div>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground" />
              <div className="text-center">
                <p className="text-sm font-semibold text-foreground">Drop JSON file or click to browse</p>
                <p className="text-xs text-muted-foreground mt-1">Supports M2F program format</p>
              </div>
            </>
          )}
        </button>
      </div>

      {jsonData && (
        <>
          {/* Mode selector */}
          <div className="mb-6 bg-card border border-border rounded-xl p-4 space-y-4">
            <p className="text-xs font-bold text-muted-foreground uppercase">Import Mode</p>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setMode("new")}
                className={`py-3 rounded-lg text-sm font-bold transition-colors ${
                  mode === "new"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                Create New Program
              </button>
              <button
                onClick={() => setMode("extend")}
                className={`py-3 rounded-lg text-sm font-bold transition-colors ${
                  mode === "extend"
                    ? "bg-primary text-primary-foreground"
                    : "bg-secondary text-muted-foreground hover:text-foreground"
                }`}
              >
                Add to Existing
              </button>
            </div>
          </div>

          {/* Mode-specific options */}
          <div className="mb-6 bg-card border border-border rounded-xl p-4 space-y-4">
            {mode === "new" ? (
              <>
                <p className="text-xs font-bold text-muted-foreground uppercase">Program Name</p>
                <input
                  value={programName}
                  onChange={e => setProgramName(e.target.value)}
                  placeholder="e.g. M2F Perform 3.2"
                  className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
                />
              </>
            ) : (
              <>
                <p className="text-xs font-bold text-muted-foreground uppercase">Select Program</p>
                <div className="relative">
                  <select
                    value={selectedProgramId}
                    onChange={e => {
                      setSelectedProgramId(e.target.value);
                      const prog = programs.find(p => p.id === e.target.value);
                      if (prog) setStartDay(prog.total_days + 1);
                    }}
                    className="w-full bg-secondary border border-border rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground focus:outline-none focus:border-primary transition-colors appearance-none"
                  >
                    <option value="">Choose a program…</option>
                    {programs.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.total_days} days)</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                </div>

                {selectedProgram && (
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-muted-foreground uppercase">Insert Starting at Day</p>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        value={startDay}
                        onChange={e => setStartDay(Number(e.target.value))}
                        className="w-24 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground text-center focus:outline-none focus:border-primary"
                      />
                      <span className="text-xs text-muted-foreground">
                        Current program has {selectedProgram.total_days} days
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setStartDay(1)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      >
                        From Start (Overwrite)
                      </button>
                      <button
                        onClick={() => setStartDay(selectedProgram.total_days + 1)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                      >
                        Append to End
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Days per week */}
          <div className="mb-6 bg-card border border-border rounded-xl p-4 space-y-3">
            <p className="text-xs font-bold text-muted-foreground uppercase">Days Per Week</p>
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={5}
                max={7}
                value={daysPerWeek}
                onChange={e => setDaysPerWeek(Number(e.target.value))}
                className="w-20 bg-secondary border border-border rounded-lg px-3 py-2 text-sm text-foreground text-center focus:outline-none focus:border-primary"
              />
              <span className="text-xs text-muted-foreground">
                Training days + rest/recovery days per week
              </span>
            </div>
          </div>

          {/* Import button */}
          <button
            onClick={handleImport}
            disabled={importing || (mode === "extend" && !selectedProgramId)}
            className="w-full py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {importing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing…
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                {mode === "new" ? "Create & Import Program" : "Import into Program"}
              </>
            )}
          </button>

          {/* Results */}
          {result && (
            <div className={`mt-6 rounded-xl border p-4 space-y-3 ${
              result.success ? "border-green-500/30 bg-green-500/5" : "border-destructive/30 bg-destructive/5"
            }`}>
              <div className="flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-destructive" />
                )}
                <p className={`text-sm font-bold ${result.success ? "text-green-500" : "text-destructive"}`}>
                  {result.success ? "Import Successful" : "Import Failed"}
                </p>
              </div>

              {result.success && (
                <div className="grid grid-cols-3 gap-3">
                  <div className="text-center">
                    <p className="text-lg font-black text-foreground">{result.total_days_imported}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Days Imported</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black text-foreground">{result.start_day}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">Start Day</p>
                  </div>
                  <div className="text-center">
                    <p className="text-lg font-black text-foreground">{result.end_day}</p>
                    <p className="text-[10px] text-muted-foreground uppercase">End Day</p>
                  </div>
                </div>
              )}

              {result.error && (
                <p className="text-xs text-destructive">{result.error}</p>
              )}

              {result.results && result.results.length > 0 && (
                <details className="text-xs">
                  <summary className="text-muted-foreground cursor-pointer hover:text-foreground font-semibold">
                    View detailed log ({result.results.length} entries)
                  </summary>
                  <div className="mt-2 max-h-64 overflow-y-auto bg-secondary/50 rounded-lg p-3 space-y-0.5 font-mono">
                    {result.results.map((r, i) => (
                      <p key={i} className={r.startsWith("❌") ? "text-destructive" : "text-muted-foreground"}>
                        {r}
                      </p>
                    ))}
                  </div>
                </details>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}
