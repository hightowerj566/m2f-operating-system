// M2F OS · Slice 6 · The Keepsake — a one-page certificate of the build.
// Generated client-side with jsPDF; dark theme matching the brand.

import { jsPDF } from "jspdf";

export interface KeepsakeData {
  dadName: string;
  babyName: string;
  arrivedAt: string;       // yyyy-mm-dd
  dueDate: string | null;  // yyyy-mm-dd
  finalScore: number | null;
  firstScore: number | null;
}

export function generateKeepsake(data: KeepsakeData) {
  const doc = new jsPDF({ orientation: "portrait", unit: "pt", format: "letter" });
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();

  // Background
  doc.setFillColor(18, 18, 20);
  doc.rect(0, 0, W, H, "F");

  // Gold frame
  doc.setDrawColor(212, 175, 55);
  doc.setLineWidth(2);
  doc.rect(28, 28, W - 56, H - 56);
  doc.setLineWidth(0.6);
  doc.rect(36, 36, W - 72, H - 72);

  const center = W / 2;
  let y = 110;

  doc.setTextColor(212, 175, 55);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("M A N   T O   F A T H E R", center, y, { align: "center" });

  y += 46;
  doc.setTextColor(245, 245, 245);
  doc.setFontSize(30);
  doc.text("THE BUILD IS COMPLETE.", center, y, { align: "center" });

  y += 26;
  doc.setFontSize(13);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(160, 160, 160);
  doc.text("The real work starts now.", center, y, { align: "center" });

  y += 70;
  doc.setFontSize(12);
  doc.text("This certifies that", center, y, { align: "center" });

  y += 34;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(26);
  doc.setTextColor(245, 245, 245);
  doc.text(data.dadName.toUpperCase(), center, y, { align: "center" });

  y += 34;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(160, 160, 160);
  doc.text("prepared, trained, and showed up — and on", center, y, { align: "center" });

  y += 30;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.setTextColor(212, 175, 55);
  const arrived = new Date(data.arrivedAt + "T00:00:00");
  doc.text(
    arrived.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" }),
    center, y, { align: "center" },
  );

  y += 34;
  doc.setTextColor(160, 160, 160);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.text("became", center, y, { align: "center" });

  y += 34;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(245, 245, 245);
  doc.text(`${data.babyName.toUpperCase()}'S DAD`, center, y, { align: "center" });

  // Score block
  if (data.finalScore != null) {
    y += 66;
    doc.setDrawColor(212, 175, 55);
    doc.setLineWidth(0.6);
    doc.line(center - 120, y, center + 120, y);

    y += 30;
    doc.setFontSize(11);
    doc.setTextColor(160, 160, 160);
    doc.setFont("helvetica", "normal");
    const scoreLine =
      data.firstScore != null && data.firstScore !== data.finalScore
        ? `Readiness Score: ${data.firstScore} → ${data.finalScore} / 70`
        : `Final Readiness Score: ${data.finalScore} / 70`;
    doc.text(scoreLine, center, y, { align: "center" });
  }

  // Footer
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text("Fatherhood is not an event. It is the lifelong process of becoming", center, H - 96, { align: "center" });
  doc.text("the man your family deserves.", center, H - 82, { align: "center" });
  doc.setTextColor(212, 175, 55);
  doc.setFont("helvetica", "bold");
  doc.text("M2F · DAY ONE", center, H - 56, { align: "center" });

  doc.save(`M2F-Keepsake-${data.babyName.replace(/\s+/g, "-")}.pdf`);
}
