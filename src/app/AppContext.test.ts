import { describe, expect, it } from "vitest";
import { initialState, reducer } from "./AppContext";

describe("AppContext reducer", () => {
  it("keeps playback active when timeline updates with preservePlayback flag", () => {
    const playingState = { ...initialState, playbackRunning: true, timelineHourOffset: 0 };
    const next = reducer(playingState, { type: "SET_TIMELINE", payload: 12, preservePlayback: true });

    expect(next.timelineHourOffset).toBe(12);
    expect(next.playbackRunning).toBe(true);
  });

  it("stops playback on manual timeline update", () => {
    const playingState = { ...initialState, playbackRunning: true, timelineHourOffset: 0 };
    const next = reducer(playingState, { type: "SET_TIMELINE", payload: 12 });

    expect(next.playbackRunning).toBe(false);
  });

  it("adds a FEMA draft generation event to feed", () => {
    const next = reducer(initialState, { type: "GENERATE_FEMA_DRAFT" });

    expect(next.feed.length).toBe(initialState.feed.length + 1);
    expect(next.feed[0].text).toContain("FEMA documentation draft generated");
    expect(next.feed[0].category).toBe("Operations");
  });

  it("activates assets workspace tab with a selected asset", () => {
    const next = reducer(initialState, { type: "SET_WORKSPACE_TAB", payload: "Assets" });

    expect(next.workspaceTab).toBe("Assets");
    expect(next.selectedAssetId).toBeTruthy();
    expect(next.feed[0].text).toContain("Workspace tab opened: Assets");
  });
});
