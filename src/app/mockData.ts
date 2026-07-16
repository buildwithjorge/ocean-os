export type Jurisdiction = {
  id: string;
  name: string;
  center: [number, number];
};

export type RiskDriver = {
  key: string;
  label: string;
  value: string;
  numeric: number;
  level: "High" | "Moderate" | "Low";
};

export type Asset = {
  id: string;
  name: string;
  status: string;
  detailA: string;
  detailB: string;
  resource: string;
  type: "boat" | "drone" | "loader" | "truck" | "crew";
  position: [number, number];
};

export type FeedCategory = "AI" | "Drone" | "Satellite" | "Operations" | "Alerts";

export type FeedEvent = {
  id: string;
  time: string;
  text: string;
  category: FeedCategory;
};

export type Mission = {
  id: string;
  jurisdiction: string;
  type: string;
  priority: string;
  startTime: string;
  assets: string[];
  crew: string;
  staging: string;
  duration: string;
  summary: string;
};

export type TimelineEvent = {
  id: string;
  label: string;
  kind: "satellite" | "drone" | "forecast" | "operations" | "tide";
  hourOffset: number;
};

export type ForecastCheckpoint = {
  label: string;
  time: string;
  coords: [number, number];
  uncertaintyKm: number;
};

export type CoastalLabel = {
  name: string;
  county: "Palm Beach" | "Broward" | "Miami-Dade";
  coords: [number, number];
};

export const jurisdictions: Jurisdiction[] = [
  { id: "jupiter", name: "Jupiter", center: [-80.0942, 26.9342] },
  { id: "juno-beach", name: "Juno Beach", center: [-80.0554, 26.8798] },
  { id: "palm-beach", name: "Palm Beach", center: [-80.0372, 26.7056] },
  { id: "delray-beach", name: "Delray Beach", center: [-80.0728, 26.4615] },
  { id: "hallandale", name: "Hallandale Beach", center: [-80.1264, 25.9861] },
  { id: "hollywood", name: "Hollywood", center: [-80.1495, 26.0112] },
  { id: "fort-lauderdale", name: "Fort Lauderdale", center: [-80.1373, 26.1224] },
  { id: "sunny-isles", name: "Sunny Isles Beach", center: [-80.1218, 25.94] },
  { id: "miami-beach", name: "Miami Beach", center: [-80.1301, 25.7907] },
  { id: "key-biscayne", name: "Key Biscayne", center: [-80.1628, 25.6935] },
  { id: "homestead-bayfront", name: "Homestead Bayfront", center: [-80.2756, 25.4764] },
  { id: "key-largo", name: "Key Largo", center: [-80.4473, 25.0865] },
  { id: "boca-raton", name: "Boca Raton", center: [-80.1289, 26.3683] },
  { id: "pompano-beach", name: "Pompano Beach", center: [-80.1248, 26.2379] },
];

export const coastalLabels: CoastalLabel[] = [
  { name: "Jupiter", county: "Palm Beach", coords: [-80.0942, 26.9342] },
  { name: "Juno Beach", county: "Palm Beach", coords: [-80.0554, 26.8798] },
  { name: "Palm Beach", county: "Palm Beach", coords: [-80.0372, 26.7056] },
  { name: "Boynton Beach", county: "Palm Beach", coords: [-80.0558, 26.5318] },
  { name: "Delray Beach", county: "Palm Beach", coords: [-80.0728, 26.4615] },
  { name: "Boca Raton", county: "Palm Beach", coords: [-80.1289, 26.3683] },
  { name: "Deerfield Beach", county: "Broward", coords: [-80.0931, 26.3184] },
  { name: "Pompano Beach", county: "Broward", coords: [-80.1248, 26.2379] },
  { name: "Lauderdale-by-the-Sea", county: "Broward", coords: [-80.0942, 26.19] },
  { name: "Fort Lauderdale", county: "Broward", coords: [-80.1373, 26.1224] },
  { name: "Dania Beach", county: "Broward", coords: [-80.1434, 26.0526] },
  { name: "Hollywood", county: "Broward", coords: [-80.1495, 26.0112] },
  { name: "Hallandale Beach", county: "Broward", coords: [-80.1264, 25.9861] },
  { name: "Sunny Isles Beach", county: "Miami-Dade", coords: [-80.1218, 25.94] },
  { name: "Bal Harbour", county: "Miami-Dade", coords: [-80.1237, 25.8918] },
  { name: "Miami Beach", county: "Miami-Dade", coords: [-80.1301, 25.7907] },
  { name: "Key Biscayne", county: "Miami-Dade", coords: [-80.1628, 25.6935] },
  { name: "Homestead Bayfront", county: "Miami-Dade", coords: [-80.2756, 25.4764] },
  { name: "Key Largo", county: "Miami-Dade", coords: [-80.4473, 25.0865] },
];

export const initialRiskDrivers: RiskDriver[] = [
  { key: "wind", label: "Wind speed east", value: "18 mph", numeric: 0.82, level: "High" },
  { key: "current", label: "Current strength", value: "0.85 m/s", numeric: 0.85, level: "High" },
  { key: "conv", label: "Current convergence", value: "0.78", numeric: 0.78, level: "High" },
  { key: "wave", label: "Wave height", value: "2.4 ft", numeric: 0.58, level: "Moderate" },
  { key: "pressure", label: "Pressure gradient", value: "12 mb", numeric: 0.68, level: "Moderate" },
  { key: "upwelling", label: "Upwelling index", value: "0.62", numeric: 0.62, level: "Moderate" },
];

export const initialAssets: Asset[] = [
  { id: "a1", name: "Boat Alpha", status: "Collecting", detailA: "Distance: 1.2 miles", detailB: "Fuel: 87%", resource: "87%", type: "boat", position: [-80.11, 25.95] },
  { id: "a2", name: "Drone 01", status: "Surveying", detailA: "Altitude: 850 ft", detailB: "Battery: 76%", resource: "76%", type: "drone", position: [-80.101, 25.99] },
  { id: "a3", name: "Loader 2", status: "Staging", detailA: "Location: South City Beach", detailB: "Readiness: 100%", resource: "100%", type: "loader", position: [-80.122, 25.978] },
  { id: "a4", name: "Truck 4", status: "En Route", detailA: "ETA: 12 minutes", detailB: "Fuel: 62%", resource: "62%", type: "truck", position: [-80.18, 26.0] },
  { id: "a5", name: "Crew Alpha", status: "On Site", detailA: "Personnel: 18", detailB: "Readiness: Active", resource: "18", type: "crew", position: [-80.127, 25.988] },
];

export const initialFeed: FeedEvent[] = [
  { id: "e1", time: "08:42", text: "Prediction updated for Hallandale Beach", category: "AI" },
  { id: "e2", time: "08:40", text: "Confidence increased to 97%", category: "AI" },
  { id: "e3", time: "08:37", text: "Drone 01 survey complete", category: "Drone" },
  { id: "e4", time: "08:31", text: "Biomass estimate updated", category: "Satellite" },
  { id: "e5", time: "08:28", text: "New satellite pass available", category: "Satellite" },
  { id: "e6", time: "08:20", text: "SAR imagery updated", category: "Satellite" },
  { id: "e7", time: "08:14", text: "Boat Alpha collected 125 tons", category: "Operations" },
  { id: "e8", time: "08:02", text: "Turtle nesting detected", category: "Alerts" },
];

export const timelineEvents: TimelineEvent[] = [
  { id: "t1", label: "Satellite pass", kind: "satellite", hourOffset: -12 },
  { id: "t2", label: "Drone survey", kind: "drone", hourOffset: -6 },
  { id: "t3", label: "Forecast update", kind: "forecast", hourOffset: 0 },
  { id: "t4", label: "Ops handoff", kind: "operations", hourOffset: 12 },
  { id: "t5", label: "High tide", kind: "tide", hourOffset: 24 },
];

export const forecastCheckpoints: ForecastCheckpoint[] = [
  { label: "May 20 08:00", time: "05-20 08:00", coords: [-79.95, 26.18] as [number, number], uncertaintyKm: 12 },
  { label: "May 20 14:00", time: "05-20 14:00", coords: [-80.02, 26.09] as [number, number], uncertaintyKm: 16 },
  { label: "May 20 20:00", time: "05-20 20:00", coords: [-80.08, 26.02] as [number, number], uncertaintyKm: 21 },
  { label: "May 21 02:00", time: "05-21 02:00", coords: [-80.12, 25.99] as [number, number], uncertaintyKm: 28 },
];

export const economics = [
  { name: "Biofuel", value: 38000 },
  { name: "Biochar", value: 42000 },
  { name: "Fertilizer", value: 14200 },
  { name: "Carbon credits", value: 18220 },
];
