import { GameRoomService } from "../../frontend/services/GameRoomService.js";

export function getOrCreateRoom(roomId, game, playerColors, logger) {
  return GameRoomService.getOrCreate(roomId, game, playerColors, logger);
}

export function peekRoom(roomId) {
  return GameRoomService.peek(roomId);
}

export function listRoomIds() {
  return GameRoomService.listRoomIds();
}

export function logRooms(logger) {
  return GameRoomService.logRooms(logger);
}

export function removeRoom(roomId) {
  return GameRoomService.remove(roomId);
}

export function clearRooms() {
  GameRoomService.clearRegistry();
}

