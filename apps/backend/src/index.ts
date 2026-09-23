import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "http";

import { env } from "./config/env";
import { connectDB } from "./config/db";
import { initSocketIO } from "./realtime/socket";
import { errorMiddleware } from "./middleware/error.middleware";
import apiRoutes from "./routes/index";

// ── Express app ────────────────────────────────────────────────────

const app = express();
const httpServer = createServer(app);

// ── Middleware ──────────────────────────────────────────────────────

app.use(
  cors({
    origin: env.frontendUrl,
    credentials: true,
  }),
);
app.use(express.json({ limit: "10mb" })); // 10mb for payment proof uploads
app.use(cookieParser());

// ── API Routes ─────────────────────────────────────────────────────

app.use("/api", apiRoutes);

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// ── Error handler (must be after routes) ───────────────────────────

app.use(errorMiddleware);

// ── Start server ───────────────────────────────────────────────────

async function start() {
  await connectDB();
  console.log("[db] Connected to MongoDB");

  initSocketIO(httpServer);

  httpServer.listen(env.port, () => {
    console.log(`[server] Backend running on http://localhost:${env.port}`);
    console.log(`[server] CORS origin: ${env.frontendUrl}`);
  });
}

start().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
