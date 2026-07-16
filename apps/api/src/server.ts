import express from "express";
import { prisma } from "./db";
import { runIntegrationSync, startIntegrationSyncScheduler, stopIntegrationSyncScheduler } from "./integrationSyncScheduler";

const app = express();
app.use(express.json());

app.get("/api/v1/health", (_req, res) => {
  res.json({ ok: true, service: "triton-api", now: new Date().toISOString() });
});

app.get("/api/v1/beaches", async (_req, res) => {
  const beaches = await prisma.beach.findMany({
    where: { active: true },
    include: {
      forecasts: { take: 1, orderBy: { issuedAt: "desc" } },
      observations: { take: 1, orderBy: { observedAt: "desc" } },
    },
    orderBy: { name: "asc" },
  });
  res.json(beaches);
});

app.get("/api/v1/feed", async (_req, res) => {
  const items = await prisma.feedEvent.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  res.json(items);
});

app.post("/api/v1/sync/run", async (_req, res) => {
  await runIntegrationSync("manual");
  res.status(202).json({ accepted: true });
});

const port = Number(process.env.API_PORT ?? 8787);
const server = app.listen(port, () => {
  console.log(`[api] listening on :${port}`);
  startIntegrationSyncScheduler();
});

async function shutdown() {
  await stopIntegrationSyncScheduler();
  await prisma.$disconnect();
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGINT", () => {
  void shutdown();
});
process.on("SIGTERM", () => {
  void shutdown();
});
