import express from "express";
import cors from "cors";
import { createServer } from "http";
import { Server } from "socket.io";
import type { ClientToServerEvents, ServerToClientEvents } from "@mathquiztador/shared";
import { config } from "./config.js";
import { connectDb } from "./db.js";
import { authRouter } from "./routes/auth.js";
import { leaderboardRouter } from "./routes/leaderboard.js";
import { setupSockets } from "./socket.js";

async function bootstrap() {
  await connectDb();

  const app = express();
  app.use(cors({ origin: config.clientOrigin, credentials: true }));
  app.use(express.json());

  app.get("/health", (_req, res) => res.json({ ok: true }));
  app.use("/api/auth", authRouter);
  app.use("/api/leaderboard", leaderboardRouter);

  const httpServer = createServer(app);
  const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: {
      origin: config.clientOrigin,
      credentials: true
    }
  });

  setupSockets(io);

  httpServer.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`);
  });
}

bootstrap().catch((err) => {
  console.error(err);
  process.exit(1);
});
