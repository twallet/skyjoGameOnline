import { generateRoomId } from "../../shared/generateRoomId.js";
import { gameRoomService } from "../services/gameRoomService.js";
import { serializeSnapshot } from "../models/roomSerializers.js";

// declaring the factory function createRoomController({ game, playerColors, logger }),
// exported so other modules can build a room controller
// by passing those dependencies in that destructured object argument.
export function createRoomController({ game, playerColors, logger }) {
  const resolvedLogger = logger;

  // Retrieve an existing room or create a new one if it does not exist yet.
  function ensureRoom(roomId) {
    return gameRoomService.getOrCreate(
      roomId,
      game,
      playerColors,
      resolvedLogger
    );
  }

  // Normalize the action result into a consistent response payload for clients.
  function serializeActionResult(room, roomId, result) {
    const serialized = serializeSnapshot(result.snapshot);
    return {
      roomId: room.roomId ?? normalizeRoomIdValue(roomId),
      players: serialized.players,
      logEntries: serialized.logEntries,
      deck: serialized.deck,
      state: serialized.state,
      event: result.event,
    };
  }

  return {
    // Responds with a minimal payload used by uptime monitors and health checks.
    health(_req, res) {
      // Quick health-check endpoint so monitoring systems can validate the controller.
      res.json({ status: "ok", message: "Skyjo rooms API" });
    },

    // Returns the list of room identifiers currently stored in memory.
    listRooms(_req, res) {
      // List all room identifiers currently registered in memory.
      const rooms = gameRoomService.listRoomIds();
      gameRoomService.logRooms(resolvedLogger);
      res.status(200).json({ rooms });
    },

    // Creates a new room or resets an existing one, returning its identifier.
    createRoom(req, res) {
      // Create a new room or reuse an empty one, resetting its state first.
      const requestedId = normalizeRoomIdValue(req.body?.roomId);
      const finalId = requestedId || generateRoomId();
      const room = ensureRoom(finalId);
      room.resetRoom();
      res
        .status(201)
        .json({ roomId: room.roomId ?? normalizeRoomIdValue(finalId) });
    },

    // Adds a player to an existing room before the game has started.
    joinRoom(req, res) {
      const { roomId } = req.params;
      const name = (req.body?.name ?? "").trim();

      if (!name) {
        // Reject joining attempts that do not include a player name.
        res.status(400).json({ error: "Player name must not be empty." });
        return;
      }

      try {
        const room = gameRoomService.peek(roomId);
        if (!room) {
          res.status(404).json({ error: "Room not found." });
          return;
        }
        if (room.getSnapshot()) {
          // Once a game is started, new players are not allowed to join.
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

    // Starts the game for the specified room and returns the opening snapshot.
    startGame(req, res) {
      const { roomId } = req.params;
      try {
        // Ensure the room exists before starting the game lifecycle.
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

    // Reveals an initial card for a player during the setup phase.
    revealInitialCard(req, res) {
      const { roomId } = req.params;
      const { playerName, position } = req.body ?? {};

      try {
        // Reveal the initial card for a player during the setup phase.
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

    // Draws a card for the specified player from either the deck or discard pile.
    drawCard(req, res) {
      const { roomId } = req.params;
      const { playerName, source } = req.body ?? {};

      if (typeof playerName !== "string" || playerName.trim() === "") {
        // Drawing requires a player context, enforce that here.
        res
          .status(400)
          .json({ error: "Player name must be provided to draw a card." });
        return;
      }

      if (source !== "deck" && source !== "discard") {
        // Source must be explicit so the game engine applies the correct logic.
        res
          .status(400)
          .json({ error: "Draw source must be either 'deck' or 'discard'." });
        return;
      }

      try {
        const room = ensureRoom(roomId);
        const result = room.drawCard(playerName, source);
        res.status(200).json(serializeActionResult(room, roomId, result));
      } catch (error) {
        res.status(400).json({
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },

    // Replaces a board position with the card the player just drew.
    replaceWithDrawnCard(req, res) {
      const { roomId } = req.params;
      const { playerName, position } = req.body ?? {};

      if (typeof playerName !== "string" || playerName.trim() === "") {
        // Validate player name so we can track the action in the game state.
        res.status(400).json({
          error: "Player name must be provided to replace a card.",
        });
        return;
      }

      if (!Number.isInteger(Number(position))) {
        // Positions are represented as integer indices on the client.
        res
          .status(400)
          .json({ error: "Card position must be an integer value." });
        return;
      }

      try {
        const room = ensureRoom(roomId);
        const result = room.replaceWithDrawnCard(playerName, Number(position));
        res.status(200).json(serializeActionResult(room, roomId, result));
      } catch (error) {
        res.status(400).json({
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },

    // Discards the drawn card, then reveals a covered card at the requested position.
    revealAfterDiscard(req, res) {
      const { roomId } = req.params;
      const { playerName, position } = req.body ?? {};

      if (typeof playerName !== "string" || playerName.trim() === "") {
        // Enforce the presence of a player name before mutating room state.
        res.status(400).json({
          error: "Player name must be provided to reveal a card.",
        });
        return;
      }

      if (!Number.isInteger(Number(position))) {
        // Guard against invalid board positions coming from the client UI.
        res
          .status(400)
          .json({ error: "Card position must be an integer value." });
        return;
      }

      try {
        const room = ensureRoom(roomId);
        const result = room.discardDrawnCardAndReveal(
          playerName,
          Number(position)
        );
        res.status(200).json(serializeActionResult(room, roomId, result));
      } catch (error) {
        res.status(400).json({
          error: error instanceof Error ? error.message : String(error),
        });
      }
    },

    // Removes the room and its state from memory, returning 204 if it existed.
    resetRoom(req, res) {
      const { roomId } = req.params;
      if (gameRoomService.remove(roomId)) {
        // Removing the room clears its state; respond with a no-content status.
        res.status(204).end();
        return;
      }
      res.status(404).json({ error: "Room not found." });
    },

    // Returns the current status and serialized snapshot (if present) for a room.
    getRoom(req, res) {
      const { roomId } = req.params;
      const room = gameRoomService.peek(roomId);
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
  // Room identifiers are stored in uppercase without surrounding whitespace.
  return roomId.trim().toUpperCase();
}
