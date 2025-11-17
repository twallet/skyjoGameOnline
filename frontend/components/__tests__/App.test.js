import { jest } from "@jest/globals";
import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { act } from "react";

import { App } from "../App.js";
import { RoomApi } from "../../services/RoomApi.js";
import { flushPromises } from "../../../tests/testUtils.js";

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
    Object.defineProperty(window, "prompt", {
      configurable: true,
      writable: true,
      value: jest.fn(() => ""),
    });
    installConsoleErrorSpy();
  });

  beforeEach(() => {
    navigator.clipboard.writeText = jest.fn().mockResolvedValue(undefined);
    window.history.replaceState(null, "", "/");
  });

  afterEach(() => {
    jest.restoreAllMocks();
    window.prompt = jest.fn(() => "");
    installConsoleErrorSpy();
  });

  afterAll(() => {
    consoleErrorSpy?.mockRestore();
  });

  it("requires a valid player name before showing room actions", async () => {
    const user = userEvent.setup();
    render(React.createElement(App));

    expect(
      screen.queryByRole("button", { name: /new room/i })
    ).not.toBeInTheDocument();

    const nameInput = screen.getByPlaceholderText(/your name/i);
    await user.type(nameInput, "Alice");
    await flushPromises();

    const createButton = await screen.findByRole("button", {
      name: /new room/i,
    });
    expect(createButton).toBeEnabled();
  });

  it("allows joining an existing room from URL invite link", async () => {
    window.history.replaceState(null, "", "/?roomId=TEST01");

    const user = userEvent.setup();
    const getRoomSpy = jest
      .spyOn(RoomApi, "getRoom")
      .mockResolvedValueOnce(playerListResponse(["Alice"])) // initial loadRoomState call
      .mockResolvedValueOnce({}) // room existence check in handleJoinRoom
      .mockResolvedValueOnce(playerListResponse(["Alice"])); // after join
    const joinRoomSpy = jest.spyOn(RoomApi, "joinRoom").mockResolvedValueOnce({
      roomId: "TEST01",
      players: ["Alice"],
    });

    render(React.createElement(App));

    await waitFor(() => {
      expect(screen.getByText("TEST01")).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText(/your name/i), "Alice");
    await flushPromises();
    await user.click(screen.getByRole("button", { name: /^join$/i }));
    await flushPromises();

    await waitFor(() => {
      expect(getRoomSpy).toHaveBeenLastCalledWith("TEST01");
    });
    expect(joinRoomSpy).toHaveBeenCalledWith("TEST01", "Alice");

    expect(await screen.findByText("TEST01")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("Alice")).toBeInTheDocument();
    });
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
    await user.click(screen.getByRole("button", { name: /new room/i }));
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
    window.history.replaceState(null, "", "/?roomId=TEST01");

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

    await waitFor(() => {
      expect(screen.getByText("TEST01")).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText(/your name/i), "Alice");
    await flushPromises();
    await user.click(screen.getByRole("button", { name: /^join$/i }));
    await flushPromises();

    await screen.findByText("TEST01");
    
    await waitFor(() => {
      expect(screen.getByTitle(/copy join link/i)).toBeInTheDocument();
    });

    await user.click(screen.getByTitle(/copy join link/i));
    await flushPromises();

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Clipboard not supported."
    );
  });

  it("copies a direct join link instead of the bare room id", async () => {
    window.history.replaceState(null, "", "/?roomId=TEST01");

    const user = userEvent.setup();
    jest
      .spyOn(RoomApi, "getRoom")
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce(playerListResponse(["Alice"]));
    jest.spyOn(RoomApi, "joinRoom").mockResolvedValueOnce({
      roomId: "TEST01",
      players: ["Alice"],
    });

    render(React.createElement(App));

    await waitFor(() => {
      expect(screen.getByText("TEST01")).toBeInTheDocument();
    });

    await user.type(screen.getByPlaceholderText(/your name/i), "Alice");
    await flushPromises();
    await user.click(screen.getByRole("button", { name: /^join$/i }));
    await flushPromises();

    await screen.findByText("TEST01");
    
    await waitFor(() => {
      expect(screen.getByTitle(/copy join link/i)).toBeInTheDocument();
    });

    await user.click(screen.getByTitle(/copy join link/i));
    await flushPromises();

    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    const copiedValue = navigator.clipboard.writeText.mock.calls[0][0];
    expect(copiedValue).toContain("roomId=TEST01");
    expect(copiedValue).toMatch(/^http/);
  });

  it("prefills the room id from the URL query string", async () => {
    window.history.replaceState(null, "", "/?roomId=ROOM42");

    const user = userEvent.setup();
    render(React.createElement(App));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument();
    });

    expect(
      screen.queryByRole("button", { name: /new room/i })
    ).not.toBeInTheDocument();

    const joinButton = await screen.findByRole("button", {
      name: /^join$/i,
    });
    expect(joinButton).toBeDisabled();

    await user.type(screen.getByPlaceholderText(/your name/i), "Bob");
    await flushPromises();
    await screen.findByText("ROOM42");
    await waitFor(() => {
      expect(joinButton).not.toBeDisabled();
    });
    expect(
      screen.getByText(/^room$/i, { selector: "span" })
    ).toBeInTheDocument();
  });
});
