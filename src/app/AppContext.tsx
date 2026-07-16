import { createContext, useContext, useEffect, useMemo, useReducer, useState } from "react";
import {
  economics,
  initialAssets,
  initialFeed,
  initialRiskDrivers,
  jurisdictions,
  timelineEvents,
  type Asset,
  type FeedCategory,
  type FeedEvent,
  type ForecastCheckpoint,
  type Mission,
  type RiskDriver,
  type TimelineEvent,
} from "./mockData";
import { getForecastSnapshot, getMockForecastSnapshot, type ForecastSnapshot } from "./forecastDataSource";

type LayerKey =
  | "sargassum"
  | "currents"
  | "wind"
  | "wave"
  | "sar"
  | "sst"
  | "chlorophyll"
  | "municipal"
  | "turtle"
  | "imagery";

type MissionForm = {
  jurisdiction: string;
  type: string;
  priority: string;
  startTime: string;
  assets: string[];
  crew: string;
  staging: string;
  duration: string;
};

type WorkspaceTab = "Dashboard" | "Operations" | "Assets" | "Analytics" | "Reports" | "Settings";

type AppState = {
  selectedJurisdiction: string;
  riskIndex: number;
  forecastConfidence: "High" | "Medium" | "Low";
  impactProbability: number;
  estimatedBiomass: [number, number];
  arrivalEta: string;
  riskDrivers: RiskDriver[];
  assets: Asset[];
  selectedAssetId: string | null;
  feed: FeedEvent[];
  feedFilter: FeedCategory | "All";
  missions: Mission[];
  activeMissionId: string | null;
  layers: Record<LayerKey, boolean>;
  timelineHourOffset: number;
  playbackRunning: boolean;
  assistantOnline: boolean;
  deployModalOpen: boolean;
  mapLayerPanelOpen: boolean;
  workspaceTab: WorkspaceTab;
  missionForm: MissionForm;
};

type AppAction =
  | { type: "SET_JURISDICTION"; payload: string }
  | { type: "TOGGLE_LAYER"; payload: LayerKey }
  | { type: "SET_LAYER"; payload: { key: LayerKey; value: boolean } }
  | { type: "SET_WORKSPACE_TAB"; payload: WorkspaceTab }
  | { type: "SELECT_ASSET"; payload: string | null }
  | { type: "SET_FEED_FILTER"; payload: FeedCategory | "All" }
  | { type: "ADD_FEED_EVENT"; payload: { text: string; category: FeedCategory } }
  | { type: "TOGGLE_MAP_LAYER_PANEL" }
  | { type: "SET_MAP_LAYER_PANEL"; payload: boolean }
  | { type: "SET_TIMELINE"; payload: number; preservePlayback?: boolean }
  | { type: "TOGGLE_PLAYBACK" }
  | { type: "OPEN_DEPLOY_MODAL"; payload: boolean }
  | { type: "SET_MISSION_FORM"; payload: Partial<MissionForm> }
  | { type: "GENERATE_MISSION" }
  | { type: "GENERATE_FEMA_DRAFT" }
  | { type: "DEPLOY_PACKAGE" }
  | { type: "OPEN_MISSION"; payload: string | null };

const baseLayers: Record<LayerKey, boolean> = {
  sargassum: true,
  currents: true,
  wind: true,
  wave: false,
  sar: false,
  sst: false,
  chlorophyll: false,
  municipal: true,
  turtle: false,
  imagery: false,
};

const initialState: AppState = {
  selectedJurisdiction: "Hallandale Beach",
  riskIndex: 91,
  forecastConfidence: "High",
  impactProbability: 97,
  estimatedBiomass: [620, 780],
  arrivalEta: "17h 24m",
  riskDrivers: initialRiskDrivers,
  assets: initialAssets,
  selectedAssetId: null,
  feed: initialFeed,
  feedFilter: "All",
  missions: [],
  activeMissionId: null,
  layers: baseLayers,
  timelineHourOffset: 0,
  playbackRunning: false,
  assistantOnline: true,
  deployModalOpen: false,
  mapLayerPanelOpen: false,
  workspaceTab: "Dashboard",
  missionForm: {
    jurisdiction: "Hallandale Beach",
    type: "Sargassum collection",
    priority: "High",
    startTime: "05:30",
    assets: ["Boat Alpha", "Loader 2"],
    crew: "18",
    staging: "South City Beach",
    duration: "18 hours",
  },
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "SET_JURISDICTION": {
      return {
        ...state,
        selectedJurisdiction: action.payload,
        missionForm: { ...state.missionForm, jurisdiction: action.payload },
      };
    }
    case "TOGGLE_LAYER": {
      return { ...state, layers: { ...state.layers, [action.payload]: !state.layers[action.payload] } };
    }
    case "SET_LAYER":
      return { ...state, layers: { ...state.layers, [action.payload.key]: action.payload.value } };
    case "SET_WORKSPACE_TAB": {
      const event: FeedEvent = {
        id: `tab-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: `Workspace tab opened: ${action.payload}`,
        category: action.payload === "Reports" ? "Alerts" : "Operations",
      };

      if (action.payload === "Dashboard") {
        return {
          ...state,
          workspaceTab: action.payload,
          feedFilter: "All",
          mapLayerPanelOpen: false,
          selectedAssetId: null,
          feed: [event, ...state.feed],
        };
      }

      if (action.payload === "Operations") {
        return {
          ...state,
          workspaceTab: action.payload,
          feedFilter: "Operations",
          mapLayerPanelOpen: false,
          feed: [event, ...state.feed],
        };
      }

      if (action.payload === "Assets") {
        return {
          ...state,
          workspaceTab: action.payload,
          feedFilter: "Operations",
          selectedAssetId: state.assets[0]?.id ?? null,
          mapLayerPanelOpen: false,
          feed: [event, ...state.feed],
        };
      }

      if (action.payload === "Analytics") {
        return {
          ...state,
          workspaceTab: action.payload,
          feedFilter: "Satellite",
          layers: { ...state.layers, chlorophyll: true, currents: true },
          mapLayerPanelOpen: true,
          feed: [event, ...state.feed],
        };
      }

      if (action.payload === "Reports") {
        return {
          ...state,
          workspaceTab: action.payload,
          feedFilter: "Alerts",
          mapLayerPanelOpen: true,
          feed: [event, ...state.feed],
        };
      }

      return {
        ...state,
        workspaceTab: action.payload,
        deployModalOpen: true,
        mapLayerPanelOpen: false,
        feed: [event, ...state.feed],
      };
    }
    case "SELECT_ASSET":
      return { ...state, selectedAssetId: action.payload };
    case "SET_FEED_FILTER":
      return { ...state, feedFilter: action.payload };
    case "ADD_FEED_EVENT": {
      const event: FeedEvent = {
        id: `evt-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: action.payload.text,
        category: action.payload.category,
      };
      return { ...state, feed: [event, ...state.feed] };
    }
    case "TOGGLE_MAP_LAYER_PANEL":
      return { ...state, mapLayerPanelOpen: !state.mapLayerPanelOpen };
    case "SET_MAP_LAYER_PANEL":
      return { ...state, mapLayerPanelOpen: action.payload };
    case "SET_TIMELINE":
      return {
        ...state,
        timelineHourOffset: action.payload,
        playbackRunning: action.preservePlayback ? state.playbackRunning : false,
      };
    case "TOGGLE_PLAYBACK":
      return { ...state, playbackRunning: !state.playbackRunning };
    case "OPEN_DEPLOY_MODAL":
      return { ...state, deployModalOpen: action.payload };
    case "SET_MISSION_FORM":
      return { ...state, missionForm: { ...state.missionForm, ...action.payload } };
    case "GENERATE_MISSION": {
      const missionId = `m-${Date.now()}`;
      const summary = `${state.missionForm.type} for ${state.missionForm.jurisdiction} at ${state.missionForm.startTime} with ${state.missionForm.assets.length} assets and crew ${state.missionForm.crew}.`;
      const mission: Mission = {
        id: missionId,
        jurisdiction: state.missionForm.jurisdiction,
        type: state.missionForm.type,
        priority: state.missionForm.priority,
        startTime: state.missionForm.startTime,
        assets: state.missionForm.assets,
        crew: state.missionForm.crew,
        staging: state.missionForm.staging,
        duration: state.missionForm.duration,
        summary,
      };
      const feedEvent: FeedEvent = {
        id: `f-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: `Mission generated: ${mission.type} in ${mission.jurisdiction}`,
        category: "Operations",
      };
      return {
        ...state,
        missions: [mission, ...state.missions],
        activeMissionId: missionId,
        feed: [feedEvent, ...state.feed],
      };
    }
    case "GENERATE_FEMA_DRAFT": {
      const reportEvent: FeedEvent = {
        id: `r-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: `FEMA documentation draft generated for ${state.selectedJurisdiction}`,
        category: "Operations",
      };

      return {
        ...state,
        feed: [reportEvent, ...state.feed],
      };
    }
    case "DEPLOY_PACKAGE": {
      const deployed: FeedEvent = {
        id: `d-${Date.now()}`,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        text: "Package Alpha deployed and mission created",
        category: "Operations",
      };
      const missionId = `m-deploy-${Date.now()}`;
      const mission: Mission = {
        id: missionId,
        jurisdiction: state.selectedJurisdiction,
        type: "Boom deployment",
        priority: "Critical",
        startTime: "05:30",
        assets: ["Boat Alpha", "Loader 2"],
        crew: "18",
        staging: "South City Beach",
        duration: "18 hours",
        summary: "Package Alpha deployed with 2 boats, 4 loaders, 18 crew, and 2 dewatering units.",
      };
      return {
        ...state,
        deployModalOpen: false,
        missions: [mission, ...state.missions],
        activeMissionId: missionId,
        feed: [deployed, ...state.feed],
      };
    }
    case "OPEN_MISSION":
      return { ...state, activeMissionId: action.payload };
    default:
      return state;
  }
}

type AppContextValue = {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  jurisdictions: typeof jurisdictions;
  forecastCheckpoints: ForecastCheckpoint[];
  forecastSource: ForecastSnapshot["source"];
  forecastUpdatedAt: string;
  forecastIsHeuristic: boolean;
  forecastMethodologyNote: string;
  forecastNote?: string;
  timelineEvents: TimelineEvent[];
  economics: typeof economics;
  filteredFeed: FeedEvent[];
};

const AppContext = createContext<AppContextValue | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [forecast, setForecast] = useState<ForecastSnapshot>(getMockForecastSnapshot());

  useEffect(() => {
    const abortController = new AbortController();

    getForecastSnapshot({ signal: abortController.signal })
      .then((snapshot) => {
        setForecast(snapshot);
      })
      .catch(() => {
        setForecast(getMockForecastSnapshot("NOAA request cancelled or unavailable"));
      });

    return () => {
      abortController.abort();
    };
  }, [state.selectedJurisdiction]);

  const contextualState = useMemo(
    () => ({
      ...state,
      riskIndex: forecast.riskIndex,
      forecastConfidence: forecast.forecastConfidence,
      impactProbability: forecast.impactProbability,
      estimatedBiomass: forecast.estimatedBiomass,
      arrivalEta: forecast.arrivalEta,
    }),
    [state, forecast],
  );

  const filteredFeed = useMemo(() => {
    if (contextualState.feedFilter === "All") return contextualState.feed;
    return contextualState.feed.filter((item) => item.category === contextualState.feedFilter);
  }, [contextualState.feed, contextualState.feedFilter]);

  const value = useMemo(
    () => ({
      state: contextualState,
      dispatch,
      jurisdictions,
      forecastCheckpoints: forecast.forecastCheckpoints,
      forecastSource: forecast.source,
      forecastUpdatedAt: forecast.updatedAt,
      forecastIsHeuristic: forecast.isHeuristic,
      forecastMethodologyNote: forecast.methodologyNote,
      forecastNote: forecast.note,
      timelineEvents,
      economics,
      filteredFeed,
    }),
    [contextualState, filteredFeed, forecast],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("useAppContext must be used within AppProvider");
  return ctx;
}

export { reducer, initialState };
export type { LayerKey, FeedCategory, MissionForm, WorkspaceTab };
