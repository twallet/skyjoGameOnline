// Backend-facing facade over the shared room registry singleton.
import { GameRoomService } from "../../shared/services/GameRoomService.js";

// Fetches an existing room or creates a new one with runtime dependencies.
export function getOrCreateRoom(roomId, game, playerColors, logger) {
  return GameRoomService.getOrCreate(roomId, game, playerColors, logger);
}

// Read-only lookup used when we only need the current snapshot.
export function peekRoom(roomId) {
  return GameRoomService.peek(roomId);
}

// Lists identifiers of all active rooms.
export function listRoomIds() {
  return GameRoomService.listRoomIds();
}

// Emits a summary of rooms through the provided logger.
export function logRooms(logger) {
  return GameRoomService.logRooms(logger);
}

// Removes a room from the registry, freeing related resources.
export function removeRoom(roomId) {
  return GameRoomService.remove(roomId);
}

// Clears the entire registry (handy for test setup/teardown).
export function clearRooms() {
  GameRoomService.clearRegistry();
}
