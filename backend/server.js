// Main server entry point that configures Express and routes for the Skyjo game API.
import express from "express";

import { staticRoot, sharedRoot } from "./config/paths.js";
import { PORT, isTestEnvironment } from "./config/environment.js";
import { consoleLogger, resolveLogger } from "../shared/utils/logger.js";
import { createSkyjoGame } from "./models/gameFactory.js";
import { buildPlayerColors } from "../shared/utils/playerColors.js";
import { createRoomController } from "./controllers/roomController.js";
import { createRoomsRouter } from "./routes/rooms.js";
import { createErrorHandler } from "./middleware/errorHandler.js";

// Factory function that creates and configures the Express application.
export function createSkyjoServer({ logger = consoleLogger } = {}) {
  const resolvedLogger = resolveLogger(logger);
  const app = express();

  // Initialize game engine and player color palette.
  const game = createSkyjoGame();
  const playerColors = buildPlayerColors(game.maxPlayers);
  const controller = createRoomController({
    game,
    playerColors,
    logger: resolvedLogger,
  });

  // Middleware: parse JSON request bodies.
  app.use(express.json());
  // Serve static frontend files from the frontend directory.
  app.use(express.static(staticRoot));
  // Serve shared modules at /shared for client-side imports.
  app.use("/shared", express.static(sharedRoot));

  // Health check endpoint.
  app.get("/health", controller.health);
  // All room-related endpoints (create, join, start, gameplay actions).
  app.use("/rooms", createRoomsRouter(controller));

  // Error handling middleware (must be last).
  app.use(createErrorHandler(resolvedLogger));

  return app;
}

// Start the server only when not running in test mode.
if (!isTestEnvironment) {
  const app = createSkyjoServer({ logger: consoleLogger });
  app.listen(PORT, () => {
    consoleLogger.info(
      `Server listening on http://localhost:${PORT} (pid ${process.pid})`
    );
  });
}
