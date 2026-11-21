import { useState } from "react";
import { Check, X } from "lucide-react";
import { MEMBERSHIP, type MembershipPlan } from "@/lib/subscriptionTiers";
import { savePreferredMembershipPlan } from "@/lib/membershipPlanPreference";

interface MembershipUpgradeModalProps {
  checkingOut: boolean;
  initialPlan?: MembershipPlan;
  onCheckout: (plan: MembershipPlan) => void;
  onClose: () => void;
}

export function MembershipUpgradeModal({ checkingOut, initialPlan = "annual", onCheckout, onClose }: MembershipUpgradeModalProps) {
  const [yearly, setYearly] = useState(initialPlan === "annual");
  const plan = yearly ? MEMBERSHIP.annual : MEMBERSHIP.monthly;
  const selectedPlan: MembershipPlan = yearly ? "annual" : "monthly";

  const selectBilling = (annual: boolean) => {
    setYearly(annual);
    savePreferredMembershipPlan(annual ? "annual" : "monthly");
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="membership-upgrade-title"
        className="max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-3xl border-t border-border bg-card p-6 pb-[calc(2rem+env(safe-area-inset-bottom))] animate-in slide-in-from-bottom"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-5 flex items-center">
          <div className="w-8" />
          <div className="mx-auto h-1 w-10 rounded-full bg-border" />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close membership options"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-6">
          <div className="space-y-2 text-center">
            <h2 id="membership-upgrade-title" className="text-2xl font-black text-foreground">
              Start Your Membership
            </h2>
            <p className="text-sm text-muted-foreground">
              Full access to training, nutrition coaching, and your fatherhood roadmap.
            </p>
            <p className="text-xs font-semibold text-primary">
              {MEMBERSHIP.trial_days}-day free trial. Cancel anytime.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-1 rounded-xl bg-secondary p-1">
            {[{ key: true, label: "Annual" }, { key: false, label: "Monthly" }].map((option) => (
              <button
                key={option.label}
                type="button"
                aria-pressed={yearly === option.key}
                onClick={() => selectBilling(option.key)}
                className={`rounded-lg py-2 text-sm font-bold transition-colors ${
                  yearly === option.key ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                }`}
              >
                {option.label}
                {option.key && <span className="ml-1 text-[10px] font-semibold opacity-80">Save 17%</span>}
              </button>
            ))}
          </div>

          <div className="space-y-4 rounded-2xl border-2 border-primary bg-background p-5">
            <div>
              <h3 className="text-lg font-black text-foreground">M2F Membership</h3>
              <div className="mt-1">
                <span className="text-3xl font-black text-foreground">${plan.per_month.toFixed(2)}</span>
                <span className="text-sm text-muted-foreground">/month</span>
                <p className="mt-0.5 text-sm font-bold text-primary">
                  {yearly ? "Billed annually" : "Billed monthly"}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {MEMBERSHIP.features.map((feature) => (
                <div key={feature} className="flex items-center gap-2">
                  <Check className="h-4 w-4 shrink-0 text-primary" />
                  <span className="text-sm text-foreground">{feature}</span>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onCheckout(selectedPlan)}
              disabled={checkingOut}
              className="flex w-full flex-col items-center gap-0.5 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-colors hover:bg-primary/90 disabled:opacity-50"
            >
              <span>{checkingOut ? "Opening checkout..." : "Start Free Trial"}</span>
              <span className="text-[10px] font-normal opacity-80">
                You won't be charged for {MEMBERSHIP.trial_days} days
              </span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full text-center text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}
