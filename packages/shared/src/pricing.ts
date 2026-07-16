export const PROCUREMENT_SOLE_SOURCE_THRESHOLD_FL_USD = 35000;

export const contractTiers = {
  starter: {
    id: "starter",
    displayName: "Starter Coastal Watch",
    monthlyPriceUsd: 8900,
  },
  municipal: {
    id: "municipal",
    displayName: "Municipal Operations",
    monthlyPriceUsd: 18900,
  },
  regional: {
    id: "regional",
    displayName: "Regional Command",
    monthlyPriceUsd: 28900,
  },
} as const;

export type ContractTierId = keyof typeof contractTiers;
