// Stripe subscription tier configuration
export const TIERS = {
  base: {
    name: "Training Only",
    monthly_price_id: "price_1T7DuEPukXMAfKKB4fC1yaLQ",
    yearly_price_id: "price_1T7DvDPukXMAfKKBsnu28EIT",
    product_ids: ["prod_U2uazuZxdSSjT4", "prod_U4SmQN8gt3RoFT", "prod_U5OhJRx7zBd74w", "prod_U5OiZotkqYvgme"],
    monthly_price: 29.99,
    yearly_price: 249,
    features: ["Custom workout programming", "Exercise video library", "1RM tracking"],
  },
  performance: {
    name: "Total Transformation",
    monthly_price_id: "price_1T7DvWPukXMAfKKBWrAwIzDM",
    yearly_price_id: "price_1T7E6QPukXMAfKKBTuZzIUhY",
    product_ids: ["prod_U2ua2GJe34qJMp", "prod_U4SoYZyZRo3rwI", "prod_U5OiR8H1Gc7RAC", "prod_U5Our6UZ2AkQGL"],
    monthly_price: 49.99,
    yearly_price: 480,
    features: [
      "Everything in Training Only",
      "Nutrition coaching & macro targets",
      "Daily macro check-ins",
      "Weekly progress reviews",
      "AI-powered macro adjustments",
    ],
  },
} as const;

export type SubscriptionTier = "base" | "performance" | null;

export function getTierFromProductId(productId: string | null): SubscriptionTier {
  if (!productId) return null;
  if ((TIERS.base.product_ids as readonly string[]).includes(productId)) return "base";
  if ((TIERS.performance.product_ids as readonly string[]).includes(productId)) return "performance";
  return null;
}

// Helper to get price_id based on billing interval
export function getPriceId(tier: "base" | "performance", yearly: boolean): string {
  return yearly ? TIERS[tier].yearly_price_id : TIERS[tier].monthly_price_id;
}

// Tabs gated behind Performance plan
export const PERFORMANCE_ONLY_TABS = ["Macros"];
