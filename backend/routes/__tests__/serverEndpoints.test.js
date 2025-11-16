/**
 * @jest-environment node
 */

import request from "supertest";

import { createSkyjoServer } from "../../server.js";
import { clearRooms } from "../../services/roomRegistryService.js";
import { createLoggerMock } from "../../../tests/testUtils.js";

describe("Skyjo server endpoints", () => {
  let app;
  let logger;

  beforeEach(() => {
    clearRooms();
    logger = createLoggerMock();
    app = createSkyjoServer({ logger });
  });

  afterEach(() => {
    clearRooms();
  });

  it("exposes a health check endpoint", async () => {
    const response = await request(app).get("/health");

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: "ok",
      message: "Skyjo rooms API",
    });
  });

  it("creates rooms and lists active room identifiers", async () => {
    const createResponse = await request(app)
      .post("/rooms")
      .send({ roomId: "room1" });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.roomId).toBe("ROOM1");

    const listResponse = await request(app).get("/rooms");

    expect(listResponse.status).toBe(200);
    expect(listResponse.body.rooms).toContain("ROOM1");
    expect(logger.info).toHaveBeenCalled();
  });

  it("allows players to join rooms and validates names", async () => {
    await request(app).post("/rooms").send({ roomId: "room2" });

    const missingName = await request(app)
      .post("/rooms/ROOM2/join")
      .send({ name: "" });
    expect(missingName.status).toBe(400);
    expect(missingName.body.error).toMatch(/must not be empty/i);

    const missingRoom = await request(app)
      .post("/rooms/MISSING/join")
      .send({ name: "Alice" });
    expect(missingRoom.status).toBe(404);
    expect(missingRoom.body.error).toMatch(/not found/i);

    const firstJoin = await request(app)
      .post("/rooms/ROOM2/join")
      .send({ name: "Alice" });
    expect(firstJoin.status).toBe(200);
    expect(firstJoin.body.players).toEqual(["Alice"]);

    const secondJoin = await request(app)
      .post("/rooms/ROOM2/join")
      .send({ name: "Bob" });
    expect(secondJoin.status).toBe(200);
    expect(secondJoin.body.players).toEqual(["Alice", "Bob"]);
  });

  it("starts games when enough players join and blocks invalid starts", async () => {
    await request(app).post("/rooms").send({ roomId: "room3" });

    const notEnoughPlayers = await request(app)
      .post("/rooms/ROOM3/start")
      .send();
    expect(notEnoughPlayers.status).toBe(400);
    expect(notEnoughPlayers.body.error).toMatch(/at least 2 players/i);

    await request(app).post("/rooms/ROOM3/join").send({ name: "Alice" });
    await request(app).post("/rooms/ROOM3/join").send({ name: "Bob" });

    const startResponse = await request(app).post("/rooms/ROOM3/start").send();

    expect(startResponse.status).toBe(200);
    expect(startResponse.body.roomId).toBe("ROOM3");
    expect(startResponse.body.players).toHaveLength(2);
    expect(Array.isArray(startResponse.body.logEntries)).toBe(true);
    expect(startResponse.body.deck).toEqual(
      expect.objectContaining({
        size: expect.any(Number),
        topCard: expect.anything(),
      })
    );
    expect(startResponse.body.state).toEqual(
      expect.objectContaining({
        phase: "initial-flip",
      })
    );

    const flipResponse = await request(app)
      .post("/rooms/ROOM3/initial-flip")
      .send({ playerName: "Alice", position: 0 });

    expect(flipResponse.status).toBe(200);
    expect(flipResponse.body.state.phase).toBe("initial-flip");
    expect(flipResponse.body.event).toEqual(
      expect.objectContaining({
        playerName: "Alice",
        position: 0,
      })
    );
    expect(
      flipResponse.body.state.initialFlip.players.find(
        (player) => player.name === "Alice"
      ).flippedPositions
    ).toEqual([0]);

    const joinAfterStart = await request(app)
      .post("/rooms/ROOM3/join")
      .send({ name: "Charlie" });
    expect(joinAfterStart.status).toBe(409);
    expect(joinAfterStart.body.error).toMatch(/already started/i);
  });

  it("resets rooms and removes them from the registry", async () => {
    await request(app).post("/rooms").send({ roomId: "room4" });
    await request(app).post("/rooms/ROOM4/join").send({ name: "Alice" });

    const resetResponse = await request(app).post("/rooms/ROOM4/reset").send();
    expect(resetResponse.status).toBe(204);
    expect(resetResponse.body).toEqual({});

    const fetchResponse = await request(app).get("/rooms/ROOM4");
    expect(fetchResponse.status).toBe(404);
  });

  it("handles main play actions after the initial flip", async () => {
    await request(app).post("/rooms").send({ roomId: "room5" });
    await request(app).post("/rooms/ROOM5/join").send({ name: "Alice" });
    await request(app).post("/rooms/ROOM5/join").send({ name: "Bob" });

    const startResponse = await request(app).post("/rooms/ROOM5/start").send();
    expect(startResponse.status).toBe(200);

    let finalFlipResponse;
    for (const playerName of ["Alice", "Bob"]) {
      for (const position of [0, 1]) {
        finalFlipResponse = await request(app)
          .post("/rooms/ROOM5/initial-flip")
          .send({ playerName, position });
      }
    }

    expect(finalFlipResponse.status).toBe(200);
    expect(finalFlipResponse.body.state.phase).toBe("main-play");

    const starterName = finalFlipResponse.body.state.activePlayer?.name;
    expect(typeof starterName).toBe("string");

    const drawResponse = await request(app)
      .post("/rooms/ROOM5/main/draw")
      .send({ playerName: starterName, source: "deck" });

    expect(drawResponse.status).toBe(200);
    expect(drawResponse.body.event).toEqual(
      expect.objectContaining({ type: "draw", playerName: starterName })
    );
    expect(drawResponse.body.state.drawnCard).toEqual(
      expect.objectContaining({ playerName: starterName })
    );

    const replaceResponse = await request(app)
      .post("/rooms/ROOM5/main/replace")
      .send({ playerName: starterName, position: 2 });

    expect(replaceResponse.status).toBe(200);
    expect(replaceResponse.body.event).toEqual(
      expect.objectContaining({ type: "replace", playerName: starterName })
    );
    expect(replaceResponse.body.state.drawnCard).toBeNull();

    const nextPlayerName = replaceResponse.body.state.activePlayer?.name;
    expect(typeof nextPlayerName).toBe("string");
    expect(nextPlayerName).not.toBe(starterName);

    const drawFromDiscard = await request(app)
      .post("/rooms/ROOM5/main/draw")
      .send({ playerName: nextPlayerName, source: "discard" });

    expect(drawFromDiscard.status).toBe(200);
    expect(drawFromDiscard.body.event.source).toBe("discard");

    const revealResponse = await request(app)
      .post("/rooms/ROOM5/main/reveal")
      .send({ playerName: nextPlayerName, position: 3 });

    expect(revealResponse.status).toBe(200);
    expect(revealResponse.body.event).toEqual(
      expect.objectContaining({ type: "reveal", playerName: nextPlayerName })
    );
    expect(revealResponse.body.event.revealed.value).not.toBe("X");
  });
});
