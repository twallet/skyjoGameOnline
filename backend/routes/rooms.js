import { Router } from "express";

export function createRoomsRouter(controller) {
  const router = Router();

  router.get("/", controller.listRooms);
  router.post("/", controller.createRoom);
  router.get("/:roomId", controller.getRoom);
  router.post("/:roomId/join", controller.joinRoom);
  router.post("/:roomId/start", controller.startGame);
  router.post("/:roomId/reset", controller.resetRoom);

  return router;
}

