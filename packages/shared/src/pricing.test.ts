/**
 * Module: pricing.test
 * Purpose: Project runtime and documentation surface.
 */
import { describe, expect, it } from "vitest";
import { contractTiers, PROCUREMENT_SOLE_SOURCE_THRESHOLD_FL_USD } from "./pricing";

describe("pricing guardrail", () => {
  it("keeps each contract tier under Florida sole-source threshold", () => {
    for (const tier of Object.values(contractTiers)) {
      expect(tier.monthlyPriceUsd).toBeLessThan(PROCUREMENT_SOLE_SOURCE_THRESHOLD_FL_USD);
    }
  });
});
