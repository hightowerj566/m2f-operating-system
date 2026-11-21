import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MembershipUpgradeModal } from "@/components/membership/MembershipUpgradeModal";

function renderOffer(onCheckout = vi.fn()) {
  render(<MembershipUpgradeModal checkingOut={false} onCheckout={onCheckout} onClose={vi.fn()} />);
  return onCheckout;
}

describe("membership upgrade offer", () => {
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
});
