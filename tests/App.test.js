import { jest } from "@jest/globals";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";

import { App } from "../frontend/components/App.js";
import { RoomApi } from "../frontend/services/RoomApi.js";

const playerListResponse = (players = [], overrides = {}) => ({
  roomId: "TEST01",
  players,
  canAddPlayer: players.length < 4,
  canStartGame: players.length >= 2,
  gameStarted: false,
  snapshot: null,
  ...overrides,
});

describe("App component room selection flow", () => {
  const originalConsoleError = console.error;
  let consoleErrorSpy;

  const installConsoleErrorSpy = () =>
    (consoleErrorSpy = jest
      .spyOn(console, "error")
      .mockImplementation((message, ...args) => {
        if (
          typeof message === "string" &&
          message.includes("not wrapped in act")
        ) {
          return;
        }
        originalConsoleError(message, ...args);
      }));

  beforeAll(() => {
    Object.defineProperty(global.navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: jest.fn(),
      },
    });
    installConsoleErrorSpy();
  });

  beforeEach(() => {
    navigator.clipboard.writeText = jest.fn().mockResolvedValue(undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
    installConsoleErrorSpy();
  });

  afterAll(() => {
    consoleErrorSpy?.mockRestore();
  });

  it("requires a valid player name before showing room actions", async () => {
    const user = userEvent.setup();
    render(React.createElement(App));

    expect(
      screen.queryByRole("button", { name: /create new room/i })
    ).not.toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/your name/i);
    await user.type(nameInput, "Alice");
    await flushPromises();

    const createButton = await screen.findByRole("button", {
      name: /create new room/i,
    });
    expect(createButton).toBeEnabled();
  });

  it("allows joining an existing room after providing a valid name and room id", async () => {
    const user = userEvent.setup();
    const getRoomSpy = jest
      .spyOn(RoomApi, "getRoom")
      .mockResolvedValueOnce({}) // room existence check
      .mockResolvedValueOnce(playerListResponse(["Alice"]));
    const joinRoomSpy = jest.spyOn(RoomApi, "joinRoom").mockResolvedValueOnce({
      roomId: "TEST01",
      players: ["Alice"],
    });

    render(React.createElement(App));

    await user.type(screen.getByPlaceholderText(/your name/i), "Alice");
    await flushPromises();
    await user.click(
      screen.getByRole("button", { name: /join existing room/i })
    );
    await flushPromises();

    const roomInput = await screen.findByPlaceholderText(/enter room code/i);
    await user.type(roomInput, "test01");
    await flushPromises();
    await user.click(screen.getByRole("button", { name: /joining room/i }));
    await flushPromises();

    await waitFor(() => {
      expect(getRoomSpy).toHaveBeenLastCalledWith("TEST01");
    });
    expect(joinRoomSpy).toHaveBeenCalledWith("TEST01", "Alice");

    expect(await screen.findByText("TEST01")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("creates a new room and locks the room selection", async () => {
    const user = userEvent.setup();
    const createRoomSpy = jest
      .spyOn(RoomApi, "createRoom")
      .mockResolvedValueOnce({ roomId: "AB12CD" });
    const joinRoomSpy = jest.spyOn(RoomApi, "joinRoom").mockResolvedValueOnce({
      roomId: "AB12CD",
      players: ["Alice"],
    });
    const getRoomSpy = jest
      .spyOn(RoomApi, "getRoom")
      .mockResolvedValueOnce(
        playerListResponse(["Alice"], { roomId: "AB12CD" })
      );

    render(React.createElement(App));

    await user.type(screen.getByPlaceholderText(/your name/i), "Alice");
    await flushPromises();
    await user.click(screen.getByRole("button", { name: /create new room/i }));
    await flushPromises();

    await waitFor(() => {
      expect(createRoomSpy).toHaveBeenCalled();
    });
    expect(joinRoomSpy).toHaveBeenCalledWith("AB12CD", "Alice");
    expect(getRoomSpy).toHaveBeenCalledWith("AB12CD");

    expect(await screen.findByText("AB12CD")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("surfaces clipboard errors when copying the room id fails", async () => {
    const user = userEvent.setup();
    jest
      .spyOn(RoomApi, "getRoom")
      .mockResolvedValueOnce({}) // existence check
      .mockResolvedValueOnce(playerListResponse(["Alice"]));
    jest.spyOn(RoomApi, "joinRoom").mockResolvedValueOnce({
      roomId: "TEST01",
      players: ["Alice"],
    });

    navigator.clipboard.writeText.mockRejectedValueOnce(
      new Error("Clipboard not supported.")
    );

    render(React.createElement(App));

    await user.type(screen.getByPlaceholderText(/your name/i), "Alice");
    await flushPromises();
    await user.click(
      screen.getByRole("button", { name: /join existing room/i })
    );
    await flushPromises();

    await user.type(
      await screen.findByPlaceholderText(/enter room code/i),
      "TEST01"
    );
    await flushPromises();
    await user.click(screen.getByRole("button", { name: /joining room/i }));
    await flushPromises();

    await screen.findByText("TEST01");

    await user.click(screen.getByTitle(/copy room id/i));
    await flushPromises();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Clipboard not supported."
    );
  });
});

async function flushPromises() {
  await act(async () => {
    await Promise.resolve();
  });
}
