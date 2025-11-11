import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { GameRoomService } from "../services/GameRoomService.js";
import { Game } from "../model/game.js";
import { consoleLogger } from "../utils/logger.js";
import { generateRoomId } from "../utils/id.js";

const app = express();
const port = process.env.PORT ?? 4000;

app.use(express.json());
const currentDir = path.dirname(fileURLToPath(import.meta.url));
const staticRoot = path.resolve(currentDir, "..");
app.use(express.static(staticRoot));

const skyjo = new Game(
  "Skyjo",
  [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  [5, 10, 15, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  [
    "../images/minus2.jpg",
    "../images/minus1.jpg",
    "../images/0.jpg",
    "../images/1.jpg",
    "../images/2.jpg",
    "../images/3.jpg",
    "../images/4.jpg",
    "../images/5.jpg",
    "../images/6.jpg",
    "../images/7.jpg",
    "../images/8.jpg",
    "../images/9.jpg",
    "../images/10.jpg",
    "../images/11.jpg",
    "../images/12.jpg",
  ],
  "../images/back.jpg",
  12,
  4,
  2,
  8
);

const playerColors = Array.from({ length: skyjo.maxPlayers }, (_, index) => {
  const hue = Math.round((index * 360) / skyjo.maxPlayers);
  return `hsl(${hue}, 70%, 85%)`;
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Skyjo rooms API" });
});

function resolveRoom(roomId) {
  return GameRoomService.getOrCreate(
    roomId,
    skyjo,
    playerColors,
    consoleLogger
  );
}

function findRoom(roomId) {
  return GameRoomService.peek(roomId);
}

app.post("/rooms", (req, res) => {
  const roomId = (req.body?.roomId ?? "").trim().toUpperCase();
  const finalId = roomId || generateRoomId();
  const room = resolveRoom(finalId);
  room.resetRoom();
  return res.status(201).json({ roomId: room.roomId ?? finalId });
});

app.post("/rooms/:roomId/join", (req, res) => {
  const { roomId } = req.params;
  const name = (req.body?.name ?? "").trim();
  if (!name) {
    return res.status(400).json({ error: "Player name must not be empty." });
  }

  try {
    const room = findRoom(roomId);
    if (!room) {
      return res.status(404).json({ error: "Room not found." });
    }
    if (room.getSnapshot()) {
      return res.status(409).json({
        error: "Game already started. New players cannot join this room.",
      });
    }
    const players = room.addPlayer(name);
    return res.status(200).json({ players, roomId: room.roomId ?? roomId });
  } catch (error) {
    return res
      .status(400)
      .json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post("/rooms/:roomId/start", (req, res) => {
  const { roomId } = req.params;
  try {
    const room = resolveRoom(roomId);
    const snapshot = room.startGame();
    return res.status(200).json({
      roomId: room.roomId ?? roomId,
      ...serializeSnapshot(snapshot),
    });
  } catch (error) {
    return res
      .status(400)
      .json({ error: error instanceof Error ? error.message : String(error) });
  }
});

app.post("/rooms/:roomId/reset", (req, res) => {
  const { roomId } = req.params;
  if (GameRoomService.remove(roomId)) {
    return res.status(204).end();
  }

  return res.status(404).json({ error: "Room not found." });
});

app.get("/rooms/:roomId", (req, res) => {
  const { roomId } = req.params;
  const room = findRoom(roomId);

  if (!room) {
    return res.status(404).json({ error: "Room not found." });
  }

  const snapshot = room.getSnapshot();
  return res.status(200).json({
    roomId: room.roomId ?? roomId,
    players: room.playerNames,
    canAddPlayer: room.canAddPlayer(),
    canStartGame: room.canStartGame(),
    gameStarted: Boolean(snapshot),
    snapshot: snapshot ? serializeSnapshot(snapshot) : null,
  });
});

function serializeSnapshot(snapshot) {
  return {
    players: snapshot.players.map(serializePlayerForClient),
    logEntries: [...snapshot.logEntries],
    deck: serializeDeck(snapshot.deck),
  };
}

function serializePlayerForClient(player) {
  return {
    name: player.name,
    color: player.color,
    hand: {
      size: player.hand.size,
      lines: player.hand.lines,
      matrix: player.hand.cardsMatrix(),
    },
  };
}

function serializeDeck(deckSnapshot) {
  if (!deckSnapshot) {
    return { size: 0, topCard: null };
  }

  const { size = 0, topCard = null } = deckSnapshot;

  return {
    size,
    topCard: topCard
      ? {
          value: topCard.value,
          image: topCard.image,
          visible: Boolean(topCard.visible),
        }
      : null,
  };
}

app.listen(port, () => {
  consoleLogger.info(`Server listening on http://localhost:${port}`);
});
