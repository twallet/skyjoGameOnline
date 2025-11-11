import { jest } from "@jest/globals";
import { RoomApi } from "../RoomApi.js";

const originalFetch = global.fetch;

const createJsonResponse = (status, payload) => ({
  ok: status >= 200 && status < 300,
  status,
  text: () => Promise.resolve(JSON.stringify(payload)),
});

const createEmptyResponse = (status) => ({
  ok: status >= 200 && status < 300,
  status,
  text: () => Promise.resolve(""),
});

describe("RoomApi", () => {
  beforeEach(() => {
    global.fetch = jest.fn();
    RoomApi.configure({ baseUrl: "http://localhost:4000" });
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  afterAll(() => {
    global.fetch = originalFetch;
  });

  it("creates a room via POST /rooms", async () => {
    const response = createJsonResponse(201, { roomId: "ABC123" });
    global.fetch.mockResolvedValueOnce(response);

    const payload = await RoomApi.createRoom("abc123");

    expect(global.fetch).toHaveBeenCalledWith("http://localhost:4000/rooms", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId: "ABC123" }),
    });
    expect(payload).toEqual({ roomId: "ABC123" });
  });

  it("joins a room via POST /rooms/:roomId/join", async () => {
    const response = createJsonResponse(200, {
      roomId: "TEST01",
      players: ["Alice"],
    });
    global.fetch.mockResolvedValueOnce(response);

    const payload = await RoomApi.joinRoom("test01", "Alice");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/rooms/TEST01/join",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "Alice" }),
      }
    );
    expect(payload.players).toEqual(["Alice"]);
  });

  it("resets a room via POST /rooms/:roomId/reset without response body", async () => {
    const response = createEmptyResponse(204);
    global.fetch.mockResolvedValueOnce(response);

    await expect(RoomApi.resetRoom("zz9999")).resolves.toBeUndefined();

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/rooms/ZZ9999/reset",
      {
        method: "POST",
        headers: {},
      }
    );
  });

  it("starts a game via POST /rooms/:roomId/start", async () => {
    const response = createJsonResponse(200, {
      roomId: "ROOM42",
      players: [],
      deck: { size: 0, topCard: null },
      logEntries: [],
    });
    global.fetch.mockResolvedValueOnce(response);

    const payload = await RoomApi.startGame("room42");

    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:4000/rooms/ROOM42/start",
      {
        method: "POST",
        headers: {},
      }
    );
    expect(payload.roomId).toBe("ROOM42");
  });

  it("throws errors from failed requests with API message", async () => {
    const response = createJsonResponse(404, {
      error: "Room not found.",
    });
    response.ok = false;
    global.fetch.mockResolvedValueOnce(response);

    await expect(RoomApi.getRoom("missing")).rejects.toThrow("Room not found.");
  });

  it("wraps network failures with descriptive errors", async () => {
    global.fetch.mockRejectedValueOnce(new Error("Network down"));

    await expect(RoomApi.getRoom("fail")).rejects.toThrow(
      /Unable to reach Skyjo rooms API/
    );
  });

  it("reports invalid JSON responses clearly", async () => {
    const badResponse = {
      ok: true,
      status: 200,
      text: () => Promise.resolve("not json"),
    };
    global.fetch.mockResolvedValueOnce(badResponse);

    await expect(RoomApi.getRoom("badjson")).rejects.toThrow(/invalid JSON/i);
  });

  it("requires configure baseUrl to be a string", () => {
    expect(() => RoomApi.configure({ baseUrl: null })).toThrow(TypeError);
  });
});
