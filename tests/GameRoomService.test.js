import { Game } from "../model/game.js";
import { GameRoomService } from "../services/GameRoomService.js";

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

describe("GameRoomService", () => {
  it("adds players and exposes current names", () => {
    const colors = ["#ffaaaa", "#aaffaa"];
    const service = new GameRoomService(skyjo, colors);

    expect(service.playerNames).toEqual([]);
    expect(service.canAddPlayer()).toBe(true);

    service.addPlayer("Alice");
    service.addPlayer("Bob");

    expect(service.playerNames).toEqual(["Alice", "Bob"]);
    expect(service.canStartGame()).toBe(true);
  });

  it("refuses to start when not enough players", () => {
    const service = new GameRoomService(skyjo);
    service.addPlayer("Alice");

    expect(service.canStartGame()).toBe(false);
    expect(() => service.startGame()).toThrow(/at least 2 players/i);
  });

  it("starts a game and resets correctly", () => {
    const service = new GameRoomService(skyjo);
    service.addPlayer("Alice");
    service.addPlayer("Bob");

    const snapshot = service.startGame();

    expect(snapshot.players).toHaveLength(2);
    expect(snapshot.logEntries.length).toBeGreaterThanOrEqual(4);

    service.resetRoom();
    expect(service.playerNames).toEqual([]);
    expect(service.canStartGame()).toBe(false);
  });
});
