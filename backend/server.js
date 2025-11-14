import express from "express";

import { staticRoot, sharedRoot } from "./config/paths.js";
import { PORT, isTestEnvironment } from "./config/environment.js";
import { consoleLogger, resolveLogger } from "../shared/logger.js";
import { createSkyjoGame } from "./models/gameFactory.js";
import { buildPlayerColors } from "./models/playerColors.js";
import { createRoomController } from "./controllers/roomController.js";
import { createRoomsRouter } from "./routes/rooms.js";
import { createErrorHandler } from "./middleware/errorHandler.js";

export function createSkyjoServer({ logger = consoleLogger } = {}) {
  const resolvedLogger = resolveLogger(logger);
  const app = express();

  const game = createSkyjoGame();
  const playerColors = buildPlayerColors(game.maxPlayers);
  const controller = createRoomController({
    game,
    playerColors,
    logger: resolvedLogger,
  });

  app.use(express.json());
  app.use(express.static(staticRoot));
  app.use("/shared", express.static(sharedRoot));

  app.get("/health", controller.health);
  app.use("/rooms", createRoomsRouter(controller));

  app.use(createErrorHandler(resolvedLogger));

  return app;
}

if (!isTestEnvironment) {
  const app = createSkyjoServer({ logger: consoleLogger });
  app.listen(PORT, () => {
    consoleLogger.info(
      `Server listening on http://localhost:${PORT} (pid ${process.pid})`
    );
  });
}
