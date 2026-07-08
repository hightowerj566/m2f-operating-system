import { useState, useEffect } from "react";
import { Download, Save, Loader2, Trash2, FileText, FileJson, FileSpreadsheet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import {
  Table, TableHeader, TableBody, TableHead, TableRow, TableCell,
} from "@/components/ui/table";
import ExcelJS from "exceljs";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface StoredRow {
  id: string;
  program_name: string;
  phase: string | null;
  week: number | null;
  day: string | null;
  block: string | null;
  exercise: string;
  sets: number | null;
  reps: string | null;
  tempo: string | null;
  rest_seconds: number | null;
  notes: string | null;
}

interface ProgramOption {
  id: string;
  name: string;
  total_days: number;
}

interface ProgramTableViewProps {
  onBack: () => void;
  currentProgramId?: string | null;
}

// ─── Section classification ───
const SECTION_ORDER = [
  "Warmup / Activation",
  "Power / Olympic Lift",
  "Primary Strength",
  "Secondary Compound",
  "Accessories",
  "Conditioning",
] as const;

function classifySection(block: string | null, exerciseName: string): string {
  const name = exerciseName.toLowerCase();
  const b = (block || "").toUpperCase();

  // Direct type mapping from import
  if (b === "W") return "Warmup / Activation";
  if (b === "COND") return "Conditioning";

  if (name.includes("warm") || name.includes("activation") || name.includes("foam") || name.includes("band pull-apart") || name.includes("mobility"))
    return "Warmup / Activation";
  if (name.includes("jump") || name.includes("throw") || name.includes("slam") || name.includes("plyo") || name.includes("explosive") || name.includes("clean") || name.includes("snatch") || name.includes("jerk"))
    return "Power / Olympic Lift";
  if (name.includes("sprint") || name.includes("sled") || name.includes("finisher") || name.includes("tabata") || name.includes("circuit") || name.includes("conditioning") || name.includes("bike") || name.includes("row erg") || name.includes("prowler"))
    return "Conditioning";
  if (b.startsWith("A")) return "Primary Strength";
  if (b.startsWith("B")) return "Secondary Compound";
  if (b.startsWith("D") || b.startsWith("E") || b.startsWith("F")) return "Accessories";
  if (b.startsWith("C")) return "Accessories";
  return "Accessories";
}

function extractLoadPercent(notes: string | null, reps: string | null): string {
  if (notes) {
    const pctMatch = notes.match(/(\d+)\s*%/);
    if (pctMatch) return `${pctMatch[1]}%`;
  }
  if (reps) {
    const pctMatch = reps.match(/(\d+)\s*%/);
    if (pctMatch) return `${pctMatch[1]}%`;
  }
  return "";
}

export function ProgramTableView({ onBack, currentProgramId }: ProgramTableViewProps) {
  const { user } = useAuth();
  const [rows, setRows] = useState<StoredRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasSaved, setHasSaved] = useState(false);
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string | null>(currentProgramId || null);

  useEffect(() => {
    supabase.from("programs").select("id, name, total_days").order("name")
      .then(({ data }) => { if (data) setPrograms(data as ProgramOption[]); });
  }, []);

  useEffect(() => {
    if (user && selectedProgramId) loadRows(selectedProgramId);
    else { setRows([]); setHasSaved(false); }
  }, [user, selectedProgramId]);

  const loadRows = async (programId: string) => {
    if (!user) return;
    setLoading(true);
    const { data } = await supabase
      .from("workout_programs").select("*")
      .eq("program_id", programId)
      .order("week", { ascending: true })
      .order("day", { ascending: true })
      .order("block", { ascending: true });
    if (data) { setRows(data as StoredRow[]); setHasSaved(data.length > 0); }
    else { setRows([]); setHasSaved(false); }
    setLoading(false);
  };

  const saveProgram = async () => {
    if (!user || !selectedProgramId) {
      toast({ title: "Select a program first", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { data: prog } = await supabase.from("programs").select("name, total_days").eq("id", selectedProgramId).single();
    if (!prog) { toast({ title: "Could not load program", variant: "destructive" }); setSaving(false); return; }

    const programName = (prog as any).name;
    const totalDays = (prog as any).total_days;
    const { data: days } = await supabase.from("program_days").select("day_number, label, exercises").eq("program_id", selectedProgramId).order("day_number", { ascending: true });
    if (!days || days.length === 0) { toast({ title: "No exercises found in program", variant: "destructive" }); setSaving(false); return; }

    await supabase.from("workout_programs").delete().eq("user_id", user.id).eq("program_id", selectedProgramId);
    const insertRows: any[] = [];

    for (const day of days) {
      const dayNum = (day as any).day_number;
      const dayLabel = (day as any).label || `Day ${dayNum}`;
      const exercises = (day as any).exercises as any[];
      const week = Math.ceil(dayNum / 7);
      const phase = getPhase(dayNum, totalDays);

      for (const ex of exercises) {
        if (ex.type === "rest" || ex.type === "mindset" || ex.type === "dad_mission") continue;
        const blockMatch = ex.name?.match(/^([A-Za-z]\d+)[\.\:\)\-\s]/);
        // Use exercise type for section mapping, fall back to block letter
        const block = ex.type === "warmup" ? "W"
          : ex.type === "conditioning" ? "COND"
          : blockMatch ? blockMatch[1] : ex.group || null;

        // Extract tempo from exercise field first, then detail
        let tempo = ex.tempo || null;
        if (!tempo && ex.detail) {
          const t4 = ex.detail.match(/tempo[:\s]*(\d{4})/i);
          const tDash = !t4 && ex.detail.match(/(\d-\d-\d(?:-\d)?)\s*tempo/i);
          const tLead = !t4 && !tDash && ex.detail.match(/tempo[:\s]*(\d-\d-\d(?:-\d)?)/i);
          tempo = t4 ? t4[1] : tDash ? tDash[1] : tLead ? tLead[1] : null;
        }

        // Build notes with RIR included
        let notes = ex.detail || "";
        const rir = ex.rir ? String(ex.rir).replace(/^RIR\s*/i, "").trim() : null;
        if (rir && !notes.includes("RIR")) {
          notes = notes ? `${notes}. RIR ${rir}` : `RIR ${rir}`;
        }

        insertRows.push({
          user_id: user.id, program_id: selectedProgramId, program_name: programName,
          phase, week, day: dayLabel, block,
          exercise: ex.name, sets: ex.sets || null,
          reps: ex.reps ? String(ex.reps) : null,
          tempo, rest_seconds: ex.rest || null, notes: notes || null,
        });
      }
    }

    if (insertRows.length === 0) { toast({ title: "No exercises to save", variant: "destructive" }); setSaving(false); return; }
    for (let i = 0; i < insertRows.length; i += 50) {
      const { error } = await supabase.from("workout_programs").insert(insertRows.slice(i, i + 50));
      if (error) { toast({ title: "Error saving program", variant: "destructive" }); setSaving(false); return; }
    }
    toast({ title: `Saved ${insertRows.length} exercises` });
    setSaving(false);
    loadRows(selectedProgramId);
  };

  const deleteStoredProgram = async () => {
    if (!user || !selectedProgramId) return;
    await supabase.from("workout_programs").delete().eq("user_id", user.id).eq("program_id", selectedProgramId);
    setRows([]); setHasSaved(false);
    toast({ title: "Stored program deleted" });
  };

  const getPhase = (dayNum: number, totalDays: number): string => {
    const totalPhases = Math.ceil(totalDays / 28);
    return `Phase ${Math.min(Math.ceil(dayNum / 28), totalPhases)}`;
  };

  const formatRest = (s: number | null) => {
    if (!s) return "";
    if (s >= 60 && s % 60 === 0) return `${s / 60}:00`;
    if (s >= 60) return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
    return `${s}s`;
  };

  // ─── Grouped data: Week → Day → Section → Rows ───
  const grouped = rows.reduce<Record<string, Record<string, StoredRow[]>>>((acc, row) => {
    const weekKey = `Week ${row.week ?? "?"}`;
    const dayKey = row.day || "Unknown";
    if (!acc[weekKey]) acc[weekKey] = {};
    if (!acc[weekKey][dayKey]) acc[weekKey][dayKey] = [];
    acc[weekKey][dayKey].push(row);
    return acc;
  }, {});

  // Group day rows into sections
  const groupBySection = (dayRows: StoredRow[]) => {
    const sections: Record<string, StoredRow[]> = {};
    for (const row of dayRows) {
      const section = classifySection(row.block, row.exercise);
      if (!sections[section]) sections[section] = [];
      sections[section].push(row);
    }
    // Return in canonical order
    return SECTION_ORDER
      .filter(s => sections[s] && sections[s].length > 0)
      .map(s => ({ section: s, rows: sections[s] }));
  };

  const selectedProgram = programs.find(p => p.id === selectedProgramId);

  const EXPORT_HEADERS = ["Exercise", "Sets", "Reps", "Load / %", "Tempo", "Rest", "Notes / Coaching Cues", "Weight Used", "RIR"];

  const rowToExport = (r: StoredRow) => [
    r.exercise,
    r.sets != null ? String(r.sets) : "",
    r.reps || "",
    extractLoadPercent(r.notes, r.reps),
    r.tempo || "",
    formatRest(r.rest_seconds),
    r.notes || "",
    "", // Weight Used — blank for athlete
    "", // RIR — blank for athlete
  ];

  // ─── CSV Export ───
  const exportCSV = () => {
    if (rows.length === 0) return;
    const csvLines: string[] = [];
    Object.entries(grouped).forEach(([weekKey, days]) => {
      Object.entries(days).forEach(([dayKey, dayRows]) => {
        csvLines.push("");
        csvLines.push(`"${weekKey} — ${dayKey}"`);
        const sections = groupBySection(dayRows);
        for (const { section, rows: sRows } of sections) {
          csvLines.push("");
          csvLines.push(`"${section}"`);
          csvLines.push(EXPORT_HEADERS.map(h => `"${h}"`).join(","));
          for (const r of sRows) {
            csvLines.push(rowToExport(r).map(v => `"${(v || "").replace(/"/g, '""')}"`).join(","));
          }
        }
      });
    });
    downloadFile(csvLines.join("\n"), `${selectedProgram?.name || "program"}.csv`, "text/csv");
  };

  // ─── Excel Export ───
  const exportXLSX = async () => {
    if (rows.length === 0) return;
    const wb = new ExcelJS.Workbook();

    Object.entries(grouped).forEach(([weekKey, days]) => {
      Object.entries(days).forEach(([dayKey, dayRows]) => {
        const sheetName = `${weekKey} - ${dayKey}`.substring(0, 31);
        const ws = wb.addWorksheet(sheetName);

        // Title row
        ws.addRow([`${weekKey} — ${dayKey}`]);
        ws.getRow(1).font = { bold: true, size: 14 };
        ws.addRow([]);

        const sections = groupBySection(dayRows);
        for (const { section, rows: sRows } of sections) {
          // Section header
          const sectionRow = ws.addRow([section]);
          sectionRow.font = { bold: true, size: 11, color: { argb: "FF4A4A8A" } };
          sectionRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF0F0F5" } };

          // Column headers
          const headerRow = ws.addRow(EXPORT_HEADERS);
          headerRow.font = { bold: true, size: 9 };
          headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1E1E1E" } };
          headerRow.font = { bold: true, size: 9, color: { argb: "FFFFFFFF" } };

          for (const r of sRows) {
            ws.addRow(rowToExport(r));
          }
          ws.addRow([]); // spacer
        }

        // Auto-width columns
        ws.columns = [
          { width: 35 }, // Exercise
          { width: 8 },  // Sets
          { width: 12 }, // Reps
          { width: 10 }, // Load/%
          { width: 10 }, // Tempo
          { width: 10 }, // Rest
          { width: 35 }, // Notes
          { width: 14 }, // Weight Used
          { width: 10 }, // RIR
        ];
      });
    });

    const buffer = await wb.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${selectedProgram?.name || "program"}.xlsx`; a.click();
    URL.revokeObjectURL(url);
  };

  // ─── JSON Export ───
  const exportJSON = () => {
    if (rows.length === 0) return;
    const structured = Object.entries(grouped).map(([weekKey, days]) => ({
      week: weekKey,
      days: Object.entries(days).map(([dayKey, dayRows]) => ({
        day: dayKey,
        sections: groupBySection(dayRows).map(({ section, rows: sRows }) => ({
          section,
          exercises: sRows.map(r => ({
            exercise: r.exercise,
            sets: r.sets,
            reps: r.reps,
            load_percent: extractLoadPercent(r.notes, r.reps),
            tempo: r.tempo,
            rest: formatRest(r.rest_seconds),
            notes: r.notes,
            weight_used: "",
            rir: "",
          })),
        })),
      })),
    }));
    const json = JSON.stringify({ program: selectedProgram?.name, data: structured }, null, 2);
    downloadFile(json, `${selectedProgram?.name || "program"}.json`, "application/json");
  };

  // ─── PDF Export ───
  const exportPDF = () => {
    if (rows.length === 0) return;
    const doc = new jsPDF({ orientation: "landscape", unit: "pt", format: "letter" });
    const progName = selectedProgram?.name || "Workout Program";
    let yPos = 40;

    doc.setFontSize(20);
    doc.setFont("helvetica", "bold");
    doc.text(progName, 40, yPos);
    yPos += 24;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(120, 120, 120);
    doc.text(`Generated ${new Date().toLocaleDateString()}`, 40, yPos);
    yPos += 30;

    Object.entries(grouped).forEach(([weekKey, days]) => {
      Object.entries(days).forEach(([dayKey, dayRows]) => {
        if (yPos > 460) { doc.addPage(); yPos = 40; }

        // Day header
        doc.setFontSize(13);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(0, 0, 0);
        doc.text(`${weekKey} — ${dayKey}`, 40, yPos);
        yPos += 8;

        const phase = dayRows[0]?.phase;
        if (phase) {
          doc.setFontSize(9);
          doc.setFont("helvetica", "normal");
          doc.setTextColor(100, 100, 100);
          doc.text(phase, 40, yPos + 10);
          yPos += 14;
        }

        const sections = groupBySection(dayRows);
        for (const { section, rows: sRows } of sections) {
          if (yPos > 460) { doc.addPage(); yPos = 40; }

          // Section label
          doc.setFontSize(10);
          doc.setFont("helvetica", "bold");
          doc.setTextColor(74, 74, 138);
          doc.text(section, 40, yPos + 12);
          yPos += 16;

          const tableData = sRows.map(r => rowToExport(r));

          autoTable(doc, {
            startY: yPos,
            head: [EXPORT_HEADERS],
            body: tableData,
            margin: { left: 40, right: 40 },
            styles: { fontSize: 7, cellPadding: 3, lineColor: [220, 220, 220], lineWidth: 0.5 },
            headStyles: {
              fillColor: [30, 30, 30], textColor: [255, 255, 255],
              fontStyle: "bold", fontSize: 7,
            },
            columnStyles: {
              0: { cellWidth: 150 },                    // Exercise
              1: { cellWidth: 35, halign: "center" },   // Sets
              2: { cellWidth: 55, halign: "center" },   // Reps
              3: { cellWidth: 45, halign: "center" },   // Load/%
              4: { cellWidth: 45, halign: "center" },   // Tempo
              5: { cellWidth: 45, halign: "center" },   // Rest
              6: { cellWidth: 130, fontSize: 6, textColor: [120, 120, 120] }, // Notes
              7: { cellWidth: 65, halign: "center" },   // Weight Used
              8: { cellWidth: 45, halign: "center" },   // RIR
            },
            alternateRowStyles: { fillColor: [248, 248, 248] },
            didDrawPage: () => { yPos = 40; },
          });

          yPos = (doc as any).lastAutoTable.finalY + 12;
        }

        yPos += 10;
      });
    });

    doc.save(`${progName}.pdf`);
  };

  const downloadFile = (content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground transition-colors">← Back</button>
        <h2 className="text-sm font-black tracking-widest text-muted-foreground uppercase">Export Program</h2>
        <div className="w-10" />
      </div>

      {/* Program Selector */}
      <div className="bg-card border border-border rounded-xl p-5 space-y-3">
        <label className="text-xs font-bold text-muted-foreground uppercase">Select Program</label>
        <select
          value={selectedProgramId || ""}
          onChange={(e) => setSelectedProgramId(e.target.value || null)}
          className="w-full bg-secondary border border-border rounded-xl px-4 py-3 text-sm font-semibold text-foreground focus:outline-none focus:border-primary transition-colors"
        >
          <option value="">— Choose a program —</option>
          {programs.map(p => (
            <option key={p.id} value={p.id}>{p.name} ({p.total_days} days)</option>
          ))}
        </select>

        {selectedProgramId && (
          <div className="flex flex-wrap gap-2 pt-2">
            <button onClick={saveProgram} disabled={saving}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 transition-colors disabled:opacity-50">
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {saving ? "Generating…" : "Save & Generate Table"}
            </button>
            {hasSaved && (
              <button onClick={deleteStoredProgram}
                className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-secondary text-destructive font-semibold text-xs border border-border hover:border-destructive/40 transition-colors">
                <Trash2 className="w-3.5 h-3.5" /> Clear Data
              </button>
            )}
          </div>
        )}
      </div>

      {/* Export Buttons */}
      {hasSaved && (
        <div className="bg-card border border-border rounded-xl p-5 space-y-3">
          <p className="text-xs font-bold text-muted-foreground uppercase">Export As</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <button onClick={exportPDF}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary text-foreground font-bold text-xs border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors">
              <FileText className="w-4 h-4 text-red-500" /> PDF
            </button>
            <button onClick={exportCSV}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary text-foreground font-bold text-xs border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors">
              <Download className="w-4 h-4 text-green-500" /> CSV
            </button>
            <button onClick={exportXLSX}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary text-foreground font-bold text-xs border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors">
              <FileSpreadsheet className="w-4 h-4 text-emerald-500" /> Excel
            </button>
            <button onClick={exportJSON}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-secondary text-foreground font-bold text-xs border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors">
              <FileJson className="w-4 h-4 text-blue-500" /> JSON
            </button>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* Empty */}
      {!loading && selectedProgramId && rows.length === 0 && (
        <div className="text-center py-12 space-y-2">
          <p className="text-sm text-muted-foreground">No saved data for this program yet.</p>
          <p className="text-xs text-muted-foreground">Click "Save & Generate Table" to store the exercises.</p>
        </div>
      )}

      {/* Preview Table — grouped by section */}
      {!loading && rows.length > 0 && (
        <div className="space-y-6">
          {Object.entries(grouped).map(([weekKey, days]) => (
            <div key={weekKey} className="space-y-4">
              <p className="text-xs font-black tracking-widest text-primary uppercase px-1">{weekKey}</p>
              {Object.entries(days).map(([dayKey, dayRows]) => {
                const sections = groupBySection(dayRows);
                return (
                  <div key={dayKey} className="bg-card border border-border rounded-xl overflow-hidden">
                    <div className="bg-secondary px-4 py-3 border-b border-border flex items-center justify-between">
                      <p className="text-xs font-black text-foreground uppercase tracking-wide">{dayKey}</p>
                      {dayRows[0]?.phase && (
                        <span className="text-[10px] font-semibold text-muted-foreground bg-background px-2 py-0.5 rounded-full">
                          {dayRows[0].phase}
                        </span>
                      )}
                    </div>
                    {sections.map(({ section, rows: sRows }) => (
                      <div key={section}>
                        <div className="px-4 py-2 bg-muted/40 border-b border-border">
                          <p className="text-[10px] font-black text-primary/80 uppercase tracking-widest">{section}</p>
                        </div>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-b border-border">
                                <TableHead className="text-[10px] uppercase font-black">Exercise</TableHead>
                                <TableHead className="text-[10px] uppercase font-black w-14 text-center">Sets</TableHead>
                                <TableHead className="text-[10px] uppercase font-black w-20 text-center">Reps</TableHead>
                                <TableHead className="text-[10px] uppercase font-black w-16 text-center">Load/%</TableHead>
                                <TableHead className="text-[10px] uppercase font-black w-16 text-center">Tempo</TableHead>
                                <TableHead className="text-[10px] uppercase font-black w-16 text-center">Rest</TableHead>
                                <TableHead className="text-[10px] uppercase font-black">Notes</TableHead>
                                <TableHead className="text-[10px] uppercase font-black w-20 text-center">Weight</TableHead>
                                <TableHead className="text-[10px] uppercase font-black w-14 text-center">RIR</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sRows.map((row) => (
                                <TableRow key={row.id}>
                                  <TableCell className="text-xs font-semibold text-foreground py-2.5">
                                    {row.exercise}
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground text-center py-2.5">
                                    {row.sets ?? "—"}
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground text-center py-2.5">
                                    {row.reps ?? "—"}
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground text-center font-mono py-2.5">
                                    {extractLoadPercent(row.notes, row.reps) || "—"}
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground text-center font-mono py-2.5">
                                    {row.tempo ?? "—"}
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground text-center py-2.5">
                                    {formatRest(row.rest_seconds) || "—"}
                                  </TableCell>
                                  <TableCell className="text-[11px] text-muted-foreground py-2.5 max-w-[200px] truncate">
                                    {row.notes || ""}
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground text-center py-2.5 bg-muted/20">
                                    —
                                  </TableCell>
                                  <TableCell className="text-xs text-muted-foreground text-center py-2.5 bg-muted/20">
                                    —
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
