import { jest } from "@jest/globals";
import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { GameSetupView } from "../GameSetupView.js";

describe("GameSetupView component", () => {
  const defaultProps = {
    isLoading: false,
    roomId: "",
    roomIdInput: "",
    gameStarted: false,
    playerName: "",
    playerNames: [],
    playerColors: ["#ff0000", "#00ff00", "#0000ff"],
    onPlayerNameChange: jest.fn(),
    onJoinRoom: jest.fn(),
    onCreateRoom: jest.fn(),
    onStartGame: jest.fn(),
    canStartGame: false,
    errorMessage: "",
    isPlayerNameValid: false,
    isJoiningRoom: false,
    hasCreatedRoom: false,
    isRoomSelectionLocked: false,
    onCopyRoomId: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("renders the player name input when not in room selection locked state", () => {
    render(React.createElement(GameSetupView, defaultProps));
    expect(screen.getByPlaceholderText(/your name/i)).toBeInTheDocument();
  });

  it("hides the player name input when room has been created", () => {
    render(
      React.createElement(GameSetupView, {
        ...defaultProps,
        hasCreatedRoom: true,
      })
    );
    expect(screen.queryByPlaceholderText(/your name/i)).not.toBeInTheDocument();
  });

  it("hides create button when player name is invalid", () => {
    render(
      React.createElement(GameSetupView, {
        ...defaultProps,
        isPlayerNameValid: false,
      })
    );
    expect(
      screen.queryByRole("button", { name: /new room/i })
    ).not.toBeInTheDocument();
  });

  it("enables create button when player name is valid", () => {
    render(
      React.createElement(GameSetupView, {
        ...defaultProps,
        isPlayerNameValid: true,
      })
    );
    const createButton = screen.getByRole("button", { name: /new room/i });
    expect(createButton).toBeEnabled();
  });

  it("shows room banner and join button when joining room", () => {
    render(
      React.createElement(GameSetupView, {
        ...defaultProps,
        isJoiningRoom: true,
        isPlayerNameValid: true,
        roomId: "TEST01",
        roomIdInput: "TEST01",
      })
    );
    expect(screen.getByText("TEST01")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^join$/i })).toBeInTheDocument();
  });

  it("disables join button when player name is invalid during join flow", () => {
    render(
      React.createElement(GameSetupView, {
        ...defaultProps,
        isJoiningRoom: true,
        isPlayerNameValid: false,
        roomId: "TEST01",
        roomIdInput: "TEST01",
      })
    );
    const joinButton = screen.getByRole("button", { name: /^join$/i });
    expect(joinButton).toBeDisabled();
  });

  it("enables join button when player name is valid during join flow", () => {
    render(
      React.createElement(GameSetupView, {
        ...defaultProps,
        isJoiningRoom: true,
        isPlayerNameValid: true,
        roomId: "TEST01",
        roomIdInput: "TEST01",
      })
    );
    const joinButton = screen.getByRole("button", { name: /^join$/i });
    expect(joinButton).toBeEnabled();
  });

  it("shows room banner when room is selected and locked", () => {
    render(
      React.createElement(GameSetupView, {
        ...defaultProps,
        roomId: "TEST01",
        isRoomSelectionLocked: true,
        isJoiningRoom: false,
      })
    );
    expect(screen.getByText("TEST01")).toBeInTheDocument();
    expect(screen.getByText(/^room$/i)).toBeInTheDocument();
  });

  it("shows copy button in room banner when not joining", () => {
    render(
      React.createElement(GameSetupView, {
        ...defaultProps,
        roomId: "TEST01",
        isRoomSelectionLocked: true,
        isJoiningRoom: false,
      })
    );
    expect(screen.getByTitle(/copy join link/i)).toBeInTheDocument();
  });

  it("disables copy button when loading or room id is missing", () => {
    render(
      React.createElement(GameSetupView, {
        ...defaultProps,
        roomId: "",
        isRoomSelectionLocked: true,
        isLoading: false,
      })
    );
    const copyButton = screen.queryByTitle(/copy join link/i);
    if (copyButton) {
      expect(copyButton).toBeDisabled();
    }
  });

  it("displays player names when provided", () => {
    render(
      React.createElement(GameSetupView, {
        ...defaultProps,
        playerNames: ["Alice", "Bob"],
      })
    );
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText(/^players$/i)).toBeInTheDocument();
  });

  it("shows inline start button when game can start and not joining", () => {
    render(
      React.createElement(GameSetupView, {
        ...defaultProps,
        playerNames: ["Alice", "Bob"],
        canStartGame: true,
        isJoiningRoom: false,
      })
    );
    expect(screen.getByRole("button", { name: /^play$/i })).toBeInTheDocument();
  });

  it("disables start button when loading", () => {
    render(
      React.createElement(GameSetupView, {
        ...defaultProps,
        playerNames: ["Alice", "Bob"],
        canStartGame: true,
        isLoading: true,
      })
    );
    const startButton = screen.getByRole("button", { name: /^play$/i });
    expect(startButton).toBeDisabled();
  });

  it("hides start button when game cannot start", () => {
    render(
      React.createElement(GameSetupView, {
        ...defaultProps,
        playerNames: ["Alice", "Bob"],
        canStartGame: false,
        isLoading: false,
      })
    );
    expect(
      screen.queryByRole("button", { name: /^play$/i })
    ).not.toBeInTheDocument();
  });

  it("disables start button when game has started", () => {
    render(
      React.createElement(GameSetupView, {
        ...defaultProps,
        playerNames: ["Alice", "Bob"],
        canStartGame: true,
        gameStarted: true,
      })
    );
    const startButton = screen.getByRole("button", { name: /^play$/i });
    expect(startButton).toBeDisabled();
  });

  it("displays error message when provided", () => {
    render(
      React.createElement(GameSetupView, {
        ...defaultProps,
        errorMessage: "Test error message",
      })
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Test error message");
  });

  it("does not display error message when empty", () => {
    render(
      React.createElement(GameSetupView, {
        ...defaultProps,
        errorMessage: "",
      })
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("calls onPlayerNameChange when player name input changes", async () => {
    const user = userEvent.setup();
    const onPlayerNameChange = jest.fn();
    render(
      React.createElement(GameSetupView, {
        ...defaultProps,
        onPlayerNameChange,
      })
    );
    const input = screen.getByPlaceholderText(/your name/i);
    await user.type(input, "Alice");
    expect(onPlayerNameChange).toHaveBeenCalled();
  });

  it("calls onCreateRoom when create button is clicked", async () => {
    const user = userEvent.setup();
    const onCreateRoom = jest.fn();
    render(
      React.createElement(GameSetupView, {
        ...defaultProps,
        isPlayerNameValid: true,
        onCreateRoom,
      })
    );
    const createButton = screen.getByRole("button", { name: /new room/i });
    await user.click(createButton);
    expect(onCreateRoom).toHaveBeenCalledTimes(1);
  });

  it("calls onJoinRoom when join button is clicked", async () => {
    const user = userEvent.setup();
    const onJoinRoom = jest.fn();
    render(
      React.createElement(GameSetupView, {
        ...defaultProps,
        isJoiningRoom: true,
        isPlayerNameValid: true,
        roomIdInput: "TEST01",
        onJoinRoom,
      })
    );
    const joinButton = screen.getByRole("button", { name: /^join$/i });
    await user.click(joinButton);
    expect(onJoinRoom).toHaveBeenCalledTimes(1);
  });

  it("calls onStartGame when start button is clicked", async () => {
    const user = userEvent.setup();
    const onStartGame = jest.fn();
    render(
      React.createElement(GameSetupView, {
        ...defaultProps,
        playerNames: ["Alice", "Bob"],
        canStartGame: true,
        onStartGame,
      })
    );
    const startButton = screen.getByRole("button", { name: /^play$/i });
    await user.click(startButton);
    expect(onStartGame).toHaveBeenCalledTimes(1);
  });

  it("calls onCopyRoomId when copy button is clicked", async () => {
    const user = userEvent.setup();
    const onCopyRoomId = jest.fn();
    render(
      React.createElement(GameSetupView, {
        ...defaultProps,
        roomId: "TEST01",
        isRoomSelectionLocked: true,
        onCopyRoomId,
      })
    );
    const copyButton = screen.getByTitle(/copy join link/i);
    await user.click(copyButton);
    expect(onCopyRoomId).toHaveBeenCalledTimes(1);
  });

  it("shows read-only room banner when joining room", () => {
    render(
      React.createElement(GameSetupView, {
        ...defaultProps,
        isJoiningRoom: true,
        roomId: "TEST01",
        roomIdInput: "TEST01",
      })
    );
    expect(screen.getByText("TEST01")).toBeInTheDocument();
  });

  it("displays room id from roomIdInput when provided", () => {
    render(
      React.createElement(GameSetupView, {
        ...defaultProps,
        isJoiningRoom: true,
        roomId: "OLD01",
        roomIdInput: "NEW01",
      })
    );
    expect(screen.getByText("NEW01")).toBeInTheDocument();
  });

  it("displays room id from roomId when roomIdInput is empty", () => {
    render(
      React.createElement(GameSetupView, {
        ...defaultProps,
        isJoiningRoom: true,
        roomId: "TEST01",
        roomIdInput: "",
      })
    );
    expect(screen.getByText("TEST01")).toBeInTheDocument();
  });

  it("applies player colors to player list items", () => {
    const playerColors = ["#ff0000", "#00ff00", "#0000ff"];
    render(
      React.createElement(GameSetupView, {
        ...defaultProps,
        playerNames: ["Alice", "Bob", "Charlie"],
        playerColors,
      })
    );
    const aliceItem = screen.getByText("Alice").closest("li");
    expect(aliceItem).toHaveStyle({ backgroundColor: "#ff0000" });
    const bobItem = screen.getByText("Bob").closest("li");
    expect(bobItem).toHaveStyle({ backgroundColor: "#00ff00" });
    const charlieItem = screen.getByText("Charlie").closest("li");
    expect(charlieItem).toHaveStyle({ backgroundColor: "#0000ff" });
  });

  it("cycles through player colors when there are more players than colors", () => {
    const playerColors = ["#ff0000", "#00ff00"];
    render(
      React.createElement(GameSetupView, {
        ...defaultProps,
        playerNames: ["Alice", "Bob", "Charlie"],
        playerColors,
      })
    );
    const aliceItem = screen.getByText("Alice").closest("li");
    expect(aliceItem).toHaveStyle({ backgroundColor: "#ff0000" });
    const bobItem = screen.getByText("Bob").closest("li");
    expect(bobItem).toHaveStyle({ backgroundColor: "#00ff00" });
    const charlieItem = screen.getByText("Charlie").closest("li");
    expect(charlieItem).toHaveStyle({ backgroundColor: "#ff0000" });
  });

  it("disables all inputs when loading", () => {
    render(
      React.createElement(GameSetupView, {
        ...defaultProps,
        isLoading: true,
      })
    );
    const nameInput = screen.getByPlaceholderText(/your name/i);
    expect(nameInput).toBeDisabled();
  });
});
