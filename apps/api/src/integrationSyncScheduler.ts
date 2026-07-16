import { prisma } from "./db";
import { fetchNoaaNdbcObservation } from "./providers/noaaNdbc";

let running = false;
let intervalHandle: NodeJS.Timeout | null = null;

const SYNC_INTERVAL_MS = Number(process.env.SYNC_INTERVAL_MS ?? 15 * 60_000);
const RUN_ON_START = String(process.env.SYNC_RUN_ON_START ?? "true").toLowerCase() !== "false";

export function startIntegrationSyncScheduler() {
  if (intervalHandle) {
    return;
  }

  if (RUN_ON_START) {
    void runIntegrationSync("startup");
  }

  intervalHandle = setInterval(() => {
    void runIntegrationSync("interval");
  }, SYNC_INTERVAL_MS);

  console.log(`[sync] scheduler started, interval=${SYNC_INTERVAL_MS}ms`);
}

export async function stopIntegrationSyncScheduler() {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
  }
}

export async function runIntegrationSync(trigger: "startup" | "interval" | "manual") {
  if (running) {
    console.log(`[sync] skipped (${trigger}) because previous run is active`);
    return;
  }

  running = true;
  const started = Date.now();
  console.log(`[sync] started (${trigger})`);

  try {
    const beaches = await prisma.beach.findMany({ where: { active: true } });

    for (const beach of beaches) {
      const stationId = toNdbcStation(beach.county);
      const observation = await fetchNoaaNdbcObservation(stationId);

      await prisma.observation.create({
        data: {
          beachId: beach.id,
          observedAt: new Date(observation.observedAt),
          sourceProvider: "noaa-ndbc",
          waveHeightM: observation.waveHeightM,
          wavePeriodS: observation.wavePeriodS,
          seaTempC: observation.seaTempC,
          windSpeedMps: observation.windSpeedMps,
          confidenceScore: observation.confidence,
          metadataJson: JSON.stringify({ stationId, confidence: observation.confidence }),
        },
      });

      await prisma.feedEvent.create({
        data: {
          beachId: beach.id,
          category: "Operations",
          text: `Synced NOAA NDBC observation for ${beach.name} (${stationId})`,
          actor: "scheduler",
        },
      });
    }

    console.log(`[sync] completed in ${Date.now() - started}ms`);
  } catch (error) {
    console.error("[sync] failed", error);
  } finally {
    running = false;
  }
}

function toNdbcStation(county: string): string {
  if (county.includes("Miami")) return "fwyf1";
  if (county.includes("Broward")) return "smkf1";
  return "41114";
}
