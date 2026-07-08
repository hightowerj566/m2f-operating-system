import { useState } from "react";
import { CreditCard, Star, X, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import { TIERS, type SubscriptionTier } from "@/lib/subscriptionTiers";

interface ManageSubscriptionViewProps {
  tier: SubscriptionTier;
  subscriptionEnd: string | null;
  cancelAtPeriodEnd?: boolean;
  onBack: () => void;
  onRefreshSub?: () => Promise<void>;
}

const CANCEL_REASONS = [
  "Too expensive",
  "Not using it enough",
  "Found a better alternative",
  "Missing features I need",
  "Not seeing results",
  "Technical issues",
  "Other",
];

type CancelStep = "manage" | "review" | "reason" | "confirming" | "done";

export function ManageSubscriptionView({ tier, subscriptionEnd, cancelAtPeriodEnd, onBack, onRefreshSub }: ManageSubscriptionViewProps) {
  const { user } = useAuth();
  const [step, setStep] = useState<CancelStep>("manage");
  const [rating, setRating] = useState(0);
  const [reason, setReason] = useState("");
  const [comments, setComments] = useState("");
  const [cancelling, setCancelling] = useState(false);

  const tierInfo = tier === "performance" ? TIERS.performance : TIERS.base;

  const handleStartCancel = () => setStep("review");

  const handleSubmitReview = () => {
    if (rating === 0) {
      toast({ title: "Please leave a rating", variant: "destructive" });
      return;
    }
    setStep("reason");
  };

  const handleSubmitReason = async () => {
    if (!reason) {
      toast({ title: "Please select a reason", variant: "destructive" });
      return;
    }
    setStep("confirming");
    setCancelling(true);

    try {
      // Save feedback
      if (user) {
        await supabase.from("cancellation_feedback").insert({
          user_id: user.id,
          rating,
          reason,
          comments: comments || null,
        });
      }

      // Cancel subscription
      const { data, error } = await supabase.functions.invoke("cancel-subscription");
      if (error || data?.error) {
        throw new Error(data?.error || "Failed to cancel");
      }

      setStep("done");
      if (onRefreshSub) await onRefreshSub();
    } catch (e: any) {
      toast({ title: e.message || "Failed to cancel subscription", variant: "destructive" });
      setStep("reason");
    } finally {
      setCancelling(false);
    }
  };

  // ---- DONE ----
  if (step === "done") {
    return (
      <div className="px-4 pt-4 pb-24 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
          <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Cancelled</p>
          <div className="w-10" />
        </div>
        <div className="bg-card border border-border rounded-xl p-6 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
            <X className="w-6 h-6 text-muted-foreground" />
          </div>
          <h2 className="text-lg font-black text-foreground">Subscription Cancelled</h2>
          <p className="text-sm text-muted-foreground">
            You'll still have access until{" "}
            {subscriptionEnd
              ? new Date(subscriptionEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })
              : "the end of your billing period"}.
          </p>
          <button onClick={onBack} className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm mt-4">
            Done
          </button>
        </div>
      </div>
    );
  }

  // ---- REASON ----
  if (step === "reason" || step === "confirming") {
    return (
      <div className="px-4 pt-4 pb-24 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setStep("review")} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
          <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Why are you leaving?</p>
          <div className="w-10" />
        </div>
        <p className="text-xs text-muted-foreground">Help us improve — what's the main reason you're cancelling?</p>

        <div className="space-y-2">
          {CANCEL_REASONS.map((r) => (
            <button
              key={r}
              onClick={() => setReason(r)}
              className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                reason === r
                  ? "border-primary bg-primary/10 text-foreground"
                  : "border-border bg-card text-muted-foreground hover:border-primary/40"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        <textarea
          placeholder="Anything else you'd like to share? (optional)"
          value={comments}
          onChange={(e) => setComments(e.target.value)}
          className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary resize-none h-20"
        />

        <button
          onClick={handleSubmitReason}
          disabled={cancelling || !reason}
          className="w-full py-3 rounded-xl bg-destructive text-destructive-foreground font-bold text-sm hover:bg-destructive/90 transition-colors disabled:opacity-50"
        >
          {cancelling ? "Cancelling..." : "Confirm Cancellation"}
        </button>
      </div>
    );
  }

  // ---- REVIEW ----
  if (step === "review") {
    return (
      <div className="px-4 pt-4 pb-24 space-y-4">
        <div className="flex items-center justify-between mb-2">
          <button onClick={() => setStep("manage")} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
          <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Rate Your Experience</p>
          <div className="w-10" />
        </div>

        <div className="bg-card border border-border rounded-xl p-6 text-center space-y-4">
          <p className="text-sm text-foreground font-semibold">Before you go, how would you rate your experience?</p>
          <div className="flex justify-center gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button key={star} onClick={() => setRating(star)} className="p-1">
                <Star
                  className={`w-8 h-8 transition-colors ${
                    star <= rating ? "text-yellow-400 fill-yellow-400" : "text-muted-foreground"
                  }`}
                />
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {rating === 0 ? "Tap to rate" : rating <= 2 ? "We're sorry to hear that" : rating <= 4 ? "Thanks for the feedback" : "Glad you enjoyed it!"}
          </p>
        </div>

        <button
          onClick={handleSubmitReview}
          disabled={rating === 0}
          className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    );
  }

  // ---- MANAGE (main view) ----
  return (
    <div className="px-4 pt-4 pb-24 space-y-4">
      <div className="flex items-center justify-between mb-2">
        <button onClick={onBack} className="text-sm text-muted-foreground hover:text-foreground">← Back</button>
        <p className="text-xs font-bold tracking-widest text-muted-foreground uppercase">Manage Subscription</p>
        <div className="w-10" />
      </div>

      <div className="bg-card border border-border rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <p className="font-bold text-sm text-foreground">{tierInfo.name}</p>
            <p className="text-xs text-muted-foreground">${tierInfo.monthly_price}/month</p>
          </div>
          {cancelAtPeriodEnd ? (
            <span className="text-[10px] font-bold text-destructive bg-destructive/10 px-2 py-0.5 rounded-full">Cancelled</span>
          ) : (
            <span className="text-[10px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">Active</span>
          )}
        </div>

        {cancelAtPeriodEnd && subscriptionEnd && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg px-3 py-2">
            <p className="text-xs text-destructive font-semibold">
              Your subscription has been cancelled. You'll retain access until{" "}
              <span className="font-bold">
                {new Date(subscriptionEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </span>.
            </p>
          </div>
        )}

        {!cancelAtPeriodEnd && subscriptionEnd && (
          <div className="bg-secondary rounded-lg px-3 py-2">
            <p className="text-xs text-muted-foreground">
              Next billing date:{" "}
              <span className="text-foreground font-semibold">
                {new Date(subscriptionEnd).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </span>
            </p>
          </div>
        )}

        <div className="space-y-1.5">
          <p className="text-xs font-bold text-muted-foreground uppercase">Your Plan Includes</p>
          {tierInfo.features.map((f) => (
            <p key={f} className="text-xs text-muted-foreground flex items-center gap-2">
              <span className="text-primary">✓</span> {f}
            </p>
          ))}
        </div>
      </div>

      {!cancelAtPeriodEnd && tier === "base" && (
        <button
          onClick={async () => {
            const { data, error } = await supabase.functions.invoke("create-checkout", {
              body: { price_id: TIERS.performance.monthly_price_id },
            });
            if (!error && data?.url) window.open(data.url, "_blank");
          }}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm hover:bg-primary/90 transition-colors"
        >
          Upgrade to Total Transformation — ${TIERS.performance.monthly_price}/mo
        </button>
      )}

      <button
        onClick={async () => {
          try {
            const { data, error } = await supabase.functions.invoke("customer-portal");
            if (!error && data?.url) window.open(data.url, "_blank");
            else toast({ title: "Could not open billing portal", variant: "destructive" });
          } catch {
            toast({ title: "Could not open billing portal", variant: "destructive" });
          }
        }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-secondary text-foreground font-bold text-sm hover:bg-secondary/80 transition-colors border border-border"
      >
        <CreditCard className="w-4 h-4" /> Manage Billing & Payment
      </button>

      {!cancelAtPeriodEnd && (
        <button
          onClick={handleStartCancel}
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-destructive/10 text-destructive font-bold text-sm hover:bg-destructive/20 transition-colors border border-destructive/20"
        >
          <AlertTriangle className="w-4 h-4" /> Cancel Subscription
        </button>
      )}
    </div>
  );
}
