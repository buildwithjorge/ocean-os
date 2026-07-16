import { useEffect } from "react";
import { AppProvider, useAppContext } from "./AppContext";
import { AppShell } from "../components/layout/AppShell";

export function getNextTimelineOffset(currentOffset: number): number {
  return currentOffset >= 72 ? -24 : currentOffset + 12;
}

function PlaybackTicker() {
  const { state, dispatch } = useAppContext();

  useEffect(() => {
    if (!state.playbackRunning) return;
    const timer = setInterval(() => {
      const next = getNextTimelineOffset(state.timelineHourOffset);
      dispatch({ type: "SET_TIMELINE", payload: next, preservePlayback: true });
    }, 1400);
    return () => clearInterval(timer);
  }, [state.playbackRunning, state.timelineHourOffset, dispatch]);

  return null;
}

function AppInner() {
  return (
    <>
      <PlaybackTicker />
      <AppShell />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppInner />
    </AppProvider>
  );
}
