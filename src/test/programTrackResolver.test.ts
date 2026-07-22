import { describe, it, expect } from "vitest";
import { decideProgramTrack } from "@/lib/programTrackResolver";

describe("decideProgramTrack", () => {
  it("member with due date and no assignment → flagship, no assignment required", () => {
    const track = decideProgramTrack({
      assignment: null,
      assignmentIsFlagship: false,
      hasJourneyDate: true,
    });
    expect(track).toEqual({ kind: "flagship", assignmentId: null });
  });

  it("member with due date and an active flagship assignment → still flagship, assignment not the source of truth", () => {
    const track = decideProgramTrack({
      assignment: { id: "assign-1", program_id: "flagship-program", current_day: 40 },
      assignmentIsFlagship: true,
      hasJourneyDate: true,
    });
    expect(track.kind).toBe("flagship");
    if (track.kind === "flagship") expect(track.assignmentId).toBe("assign-1");
  });

  it("member with a non-flagship coach assignment → coach program takes priority", () => {
    const track = decideProgramTrack({
      assignment: { id: "assign-2", program_id: "coach-program", current_day: 12 },
      assignmentIsFlagship: false,
      hasJourneyDate: true, // due date present but coach program still wins
    });
    expect(track).toEqual({
      kind: "coach",
      assignmentId: "assign-2",
      programId: "coach-program",
      currentDay: 12,
    });
  });

  it("no assignment and no due date → needs due date", () => {
    const track = decideProgramTrack({
      assignment: null,
      assignmentIsFlagship: false,
      hasJourneyDate: false,
    });
    expect(track).toEqual({ kind: "none", assignmentId: null });
  });

  it("coach assignment with a null current_day defaults to day 1", () => {
    const track = decideProgramTrack({
      assignment: { id: "assign-3", program_id: "coach-program", current_day: null },
      assignmentIsFlagship: false,
      hasJourneyDate: false,
    });
    expect(track.kind).toBe("coach");
    if (track.kind === "coach") expect(track.currentDay).toBe(1);
  });
});
