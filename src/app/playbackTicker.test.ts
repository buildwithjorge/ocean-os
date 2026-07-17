/**
 * Module: playbackTicker.test
 * Purpose: Project runtime and documentation surface.
 */
import { describe, expect, it } from "vitest";
import { getNextTimelineOffset } from "./App";

describe("Playback ticker timeline looping", () => {
  it("advances by 12 hours within range", () => {
    expect(getNextTimelineOffset(0)).toBe(12);
    expect(getNextTimelineOffset(24)).toBe(36);
  });

  it("loops back to -24 after 72", () => {
    expect(getNextTimelineOffset(72)).toBe(-24);
    expect(getNextTimelineOffset(84)).toBe(-24);
  });
});
