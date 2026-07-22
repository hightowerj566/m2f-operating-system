import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { FlagshipJourneyCard } from "@/components/workout/FlagshipJourneyCard";
import type { FlagshipDayResult } from "@/lib/flagshipWorkoutAdapter";

function activeRecoveryResult(): FlagshipDayResult {
  return {
    label: "Active Recovery",
    exercises: [],
    meta: {
      programDay: 12,
      dayType: "active-recovery",
      isRequired: true,
      stageId: "foundation",
      stageName: "Foundation",
      objective: "Easy movement to recover from training.",
      activities: [
        { type: "walking", target: "20-30 minutes", intensity: "easy" },
        { type: "mobility", target: "5-10 minutes", intensity: "easy" },
      ],
      completionCriteria: ["Complete an easy walk or intentionally rest."],
      completionMessage: "Nice work — recovery is training too.",
      status: "active",
      contentId: "flagship-day-12",
    },
  };
}

describe("FlagshipJourneyCard", () => {
  it("renders rest/recovery day content instead of a missing-workout message", () => {
    render(<FlagshipJourneyCard result={activeRecoveryResult()} />);
    expect(screen.getByText("Active Recovery")).toBeInTheDocument();
    expect(screen.getByText(/Easy movement to recover/)).toBeInTheDocument();
    expect(screen.getByText(/Complete an easy walk or intentionally rest/)).toBeInTheDocument();
    expect(screen.queryByText(/No exercises programmed/)).not.toBeInTheDocument();
  });

  it("shows an add-due-date action for the needs-due-date state", () => {
    const onAdd = vi.fn();
    const result: FlagshipDayResult = {
      label: "Set your due date",
      exercises: [],
      meta: {
        dayType: "transition",
        isRequired: false,
        stageId: "unset",
        status: "needs-due-date",
        objective: "Add your due date to unlock the M2F Guided Journey.",
        contentId: "flagship-needs-due-date",
      },
    };
    render(<FlagshipJourneyCard result={result} onAddDueDate={onAdd} />);
    expect(screen.getByText("Add Your Due Date")).toBeInTheDocument();
  });

  it("marks completion via the provided callback", () => {
    const onComplete = vi.fn();
    render(<FlagshipJourneyCard result={activeRecoveryResult()} onMarkComplete={onComplete} completed={false} />);
    screen.getByText(/Mark active recovery Complete/i).click();
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
