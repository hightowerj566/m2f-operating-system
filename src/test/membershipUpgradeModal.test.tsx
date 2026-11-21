import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { MembershipUpgradeModal } from "@/components/membership/MembershipUpgradeModal";
import type { MembershipPlan } from "@/lib/subscriptionTiers";

function renderOffer(onCheckout = vi.fn(), initialPlan: MembershipPlan = "annual") {
  render(<MembershipUpgradeModal checkingOut={false} initialPlan={initialPlan} onCheckout={onCheckout} onClose={vi.fn()} />);
  return onCheckout;
}

describe("membership upgrade offer", () => {
  beforeEach(() => localStorage.clear());

  it("defaults to the $24.99 annual plan and starts annual checkout", () => {
    const onCheckout = renderOffer();

    expect(screen.getByText("$24.99")).toBeInTheDocument();
    expect(screen.getByText("Billed annually")).toBeInTheDocument();
    expect(screen.getByText("7-day free trial. Cancel anytime.")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /start free trial/i }));
    expect(onCheckout).toHaveBeenCalledWith("annual");
  });

  it("switches to the $29.99 monthly plan and starts monthly checkout", () => {
    const onCheckout = renderOffer();

    fireEvent.click(screen.getByRole("button", { name: "Monthly" }));
    expect(screen.getByText("$29.99")).toBeInTheDocument();
    expect(screen.getByText("Billed monthly")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /start free trial/i }));
    expect(onCheckout).toHaveBeenCalledWith("monthly");
  });

  it("opens with the monthly plan chosen before signup", () => {
    const onCheckout = renderOffer(vi.fn(), "monthly");

    expect(screen.getByText("$29.99")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /start free trial/i }));
    expect(onCheckout).toHaveBeenCalledWith("monthly");
  });
});
