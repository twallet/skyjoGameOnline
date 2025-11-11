/**
 * @jest-environment node
 */

import { jest } from "@jest/globals";
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
});
