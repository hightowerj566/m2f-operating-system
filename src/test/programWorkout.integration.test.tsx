import { beforeEach, describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import ProgramWorkout from "@/pages/ProgramWorkout";

vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => ({ user: { id: "member-1" }, loading: false }),
}));

vi.mock("@/hooks/useMemberProgram", () => ({
  useMemberProgram: () => ({
    data: {
      stage: { name: "Foundation" },
      flagshipDay: {
        status: "active",
        programDay: 1,
        day: { workoutId: "fnd-upperA-w1", dayType: "training" },
      },
    },
  }),
}));

describe("ProgramWorkout guided journey integration", () => {
  beforeEach(() => localStorage.clear());

  it("renders resolved exercise cards for Full, Express, and Minimum", () => {
    render(
      <MemoryRouter initialEntries={["/programs/workout/fnd-upperA-w1"]}>
        <Routes>
          <Route path="/programs/workout/:slug" element={<ProgramWorkout />} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText("Barbell bench press")).toBeInTheDocument();
    expect(screen.getAllByRole("article")).toHaveLength(5);

    fireEvent.click(screen.getByRole("button", { name: "Express" }));
    expect(screen.getAllByRole("article")).toHaveLength(3);

    fireEvent.click(screen.getByRole("button", { name: "Minimum" }));
    expect(screen.getAllByRole("article")).toHaveLength(4);
    expect(screen.getByText("Push-up or press")).toBeInTheDocument();
  });
});
