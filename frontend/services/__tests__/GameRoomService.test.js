import { jest } from "@jest/globals";
import { Game } from "../../models/game.js";
import { GameRoomService } from "../GameRoomService.js";
import { createLoggerMock } from "../../../tests/testUtils.js";

const skyjo = new Game(
  "Skyjo",
  [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  [5, 10, 15, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  [
    "./assets/images/minus2.jpg",
    "./assets/images/minus1.jpg",
    "./assets/images/0.jpg",
    "./assets/images/1.jpg",
    "./assets/images/2.jpg",
    "./assets/images/3.jpg",
    "./assets/images/4.jpg",
    "./assets/images/5.jpg",
    "./assets/images/6.jpg",
    "./assets/images/7.jpg",
    "./assets/images/8.jpg",
    "./assets/images/9.jpg",
    "./assets/images/10.jpg",
    "./assets/images/11.jpg",
    "./assets/images/12.jpg",
  ],
  "./assets/images/back.jpg",
  12,
  4,
  2,
  8
);

describe("GameRoomService", () => {
  beforeEach(() => {
    GameRoomService.clearRegistry();
  });

  it("adds players and exposes current names", () => {
    const colors = ["#ffaaaa", "#aaffaa"];
    const logger = createLoggerMock();
    const service = GameRoomService.getOrCreate(
      "room-1",
      skyjo,
      colors,
      logger
    );

    expect(service.playerNames).toEqual([]);
    expect(service.canAddPlayer()).toBe(true);

    service.addPlayer("Alice");
    service.addPlayer("Bob");

    expect(service.playerNames).toEqual(["Alice", "Bob"]);
    expect(service.canStartGame()).toBe(true);
    expect(service.roomId).toBe("room-1");
    expect(GameRoomService.getOrCreate("room-1", skyjo, colors, logger)).toBe(
      service
    );
    expect(logger.info).toHaveBeenCalled();
  });

  it("refuses to start when not enough players", () => {
    const logger = createLoggerMock();
    const service = GameRoomService.getOrCreate("room-2", skyjo, [], logger);
    service.addPlayer("Alice");

    expect(service.canStartGame()).toBe(false);
    expect(() => service.startGame()).toThrow(/at least 2 players/i);
    expect(logger.info).toHaveBeenCalled();
  });

  it("starts a game and resets correctly", () => {
    const logger = createLoggerMock();
    const service = GameRoomService.getOrCreate("room-3", skyjo, [], logger);
    service.addPlayer("Alice");
    service.addPlayer("Bob");

    const snapshot = service.startGame();

    expect(snapshot.players).toHaveLength(2);
    expect(snapshot.logEntries.length).toBeGreaterThanOrEqual(4);
    expect(service.canAddPlayer()).toBe(false);
    expect(service.canStartGame()).toBe(false);
    expect(service.getSnapshot()).toBe(snapshot);

    service.resetRoom();
    expect(service.playerNames).toEqual([]);
    expect(service.canStartGame()).toBe(false);
    expect(service.canAddPlayer()).toBe(true);
    expect(service.getSnapshot()).toBe(null);
    expect(GameRoomService.remove("room-3")).toBe(true);
    expect(GameRoomService.remove("room-3")).toBe(false);
    expect(logger.info).toHaveBeenCalled();
  });

  it("prevents adding players once the game has started", () => {
    const logger = createLoggerMock();
    const service = GameRoomService.getOrCreate("room-4", skyjo, [], logger);
    service.addPlayer("Alice");
    service.addPlayer("Bob");

    service.startGame();

    expect(() => service.addPlayer("Charlie")).toThrow(
      "Cannot add players after the game has started."
    );
    expect(() => service.startGame()).toThrow(
      "Game has already started for this room."
    );
  });

  it("rejects empty or non-string room identifiers", () => {
    expect(() => GameRoomService.getOrCreate("", skyjo)).toThrow(TypeError);
    expect(() => GameRoomService.getOrCreate("   ", skyjo)).toThrow(TypeError);
    expect(() => GameRoomService.getOrCreate(null, skyjo)).toThrow(TypeError);
  });

  it("reuses existing rooms and logs reuse events", () => {
    const logger = createLoggerMock();
    const colors = ["#ffaaaa", "#aaffaa"];
    const first = GameRoomService.getOrCreate("room-5", skyjo, colors, logger);
    const second = GameRoomService.getOrCreate("room-5", skyjo, colors, logger);

    expect(second).toBe(first);
    expect(logger.info).toHaveBeenCalledWith(
      "GameRoomService: created room 'room-5' with game Skyjo"
    );
  });

  it("peek returns existing rooms and list/log reflects registry state", () => {
    const logger = createLoggerMock();
    expect(GameRoomService.peek("missing")).toBeNull();
    expect(GameRoomService.listRoomIds()).toEqual([]);
    expect(GameRoomService.logRooms(logger)).toEqual([]);
    expect(logger.info).toHaveBeenCalledWith(
      "GameRoomService: no active rooms."
    );

    GameRoomService.getOrCreate("room-6", skyjo, [], logger);
    GameRoomService.getOrCreate("room-7", skyjo, [], logger);

    const ids = GameRoomService.listRoomIds();
    expect(ids).toEqual(["room-6", "room-7"]);
    expect(GameRoomService.peek("room-6")).not.toBeNull();
    expect(GameRoomService.logRooms(logger)).toEqual(ids);
  });

  it("stops allowing additional players when max players reached", () => {
    const logger = createLoggerMock();
    const service = GameRoomService.getOrCreate("room-8", skyjo, [], logger);
    for (let i = 0; i < skyjo.maxPlayers; i++) {
      service.addPlayer(`Player ${i + 1}`);
    }

    expect(service.canAddPlayer()).toBe(false);
    expect(() => service.addPlayer("Extra")).toThrow();
  });
});
