import { generateRoomId } from "../../frontend/utils/id.js";
import {
  getOrCreateRoom,
  listRoomIds,
  logRooms,
  peekRoom,
  removeRoom,
} from "../services/roomRegistryService.js";
import { serializeSnapshot } from "../models/roomSerializers.js";

export function createRoomController({ game, playerColors, logger }) {
  const resolvedLogger = logger;

  function ensureRoom(roomId) {
    return getOrCreateRoom(roomId, game, playerColors, resolvedLogger);
  }

  return {
    health(_req, res) {
      res.json({ status: "ok", message: "Skyjo rooms API" });
    },

    listRooms(_req, res) {
      const rooms = listRoomIds();
      logRooms(resolvedLogger);
      res.status(200).json({ rooms });
    },

    createRoom(req, res) {
      const requestedId = normalizeRoomIdValue(req.body?.roomId);
      const finalId = requestedId || generateRoomId();
      const room = ensureRoom(finalId);
      room.resetRoom();
      res
        .status(201)
        .json({ roomId: room.roomId ?? normalizeRoomIdValue(finalId) });
    },

    joinRoom(req, res) {
      const { roomId } = req.params;
      const name = (req.body?.name ?? "").trim();

      if (!name) {
        res.status(400).json({ error: "Player name must not be empty." });
        return;
      }

      try {
        const room = peekRoom(roomId);
        if (!room) {
          res.status(404).json({ error: "Room not found." });
          return;
        }
        if (room.getSnapshot()) {
          res.status(409).json({
            error: "Game already started. New players cannot join this room.",
          });
          return;
        }

        const players = room.addPlayer(name);
        res.status(200).json({
          players,
          roomId: room.roomId ?? normalizeRoomIdValue(roomId),
        });
      } catch (error) {
        res.status(400).json({
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },

    startGame(req, res) {
      const { roomId } = req.params;
      try {
        const room = ensureRoom(roomId);
        const snapshot = room.startGame();
        const serialized = serializeSnapshot(snapshot);
        res.status(200).json({
          roomId: room.roomId ?? normalizeRoomIdValue(roomId),
          players: serialized.players,
          logEntries: serialized.logEntries,
          deck: serialized.deck,
          state: serialized.state,
        });
      } catch (error) {
        res.status(400).json({
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },

    revealInitialCard(req, res) {
      const { roomId } = req.params;
      const { playerName, position } = req.body ?? {};

      try {
        const room = ensureRoom(roomId);
        const result = room.revealInitialCard(playerName, position);
        const serialized = serializeSnapshot(result.snapshot);

        res.status(200).json({
          roomId: room.roomId ?? normalizeRoomIdValue(roomId),
          players: serialized.players,
          logEntries: serialized.logEntries,
          deck: serialized.deck,
          state: serialized.state,
          event: result.event,
        });
      } catch (error) {
        res.status(400).json({
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },

    resetRoom(req, res) {
      const { roomId } = req.params;
      if (removeRoom(roomId)) {
        res.status(204).end();
        return;
      }
      res.status(404).json({ error: "Room not found." });
    },

    getRoom(req, res) {
      const { roomId } = req.params;
      const room = peekRoom(roomId);
      if (!room) {
        res.status(404).json({ error: "Room not found." });
        return;
      }

      const snapshot = room.getSnapshot();
      res.status(200).json({
        roomId: room.roomId ?? normalizeRoomIdValue(roomId),
        players: room.playerNames,
        canAddPlayer: room.canAddPlayer(),
        canStartGame: room.canStartGame(),
        gameStarted: Boolean(snapshot),
        snapshot: snapshot ? serializeSnapshot(snapshot) : null,
      });
    },
  };
}

function normalizeRoomIdValue(roomId) {
  if (typeof roomId !== "string") {
    return "";
  }
  return roomId.trim().toUpperCase();
}
