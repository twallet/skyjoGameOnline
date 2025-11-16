// Defines the HTTP routes exposed for room interactions.
import { Router } from "express";

export function createRoomsRouter(controller) {
  const router = Router();

  // Room lifecycle endpoints.
  router.get("/", controller.listRooms);
  router.post("/", controller.createRoom);
  router.get("/:roomId", controller.getRoom);
  router.post("/:roomId/join", controller.joinRoom);
  router.post("/:roomId/start", controller.startGame);
  router.post("/:roomId/initial-flip", controller.revealInitialCard);
  // Main phase actions after the initial flip.
  router.post("/:roomId/main/draw", controller.drawCard);
  router.post("/:roomId/main/replace", controller.replaceWithDrawnCard);
  router.post("/:roomId/main/reveal", controller.revealAfterDiscard);
  router.post("/:roomId/reset", controller.resetRoom);

  return router;
}
