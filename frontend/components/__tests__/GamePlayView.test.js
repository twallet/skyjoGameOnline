import React, { act } from "react";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { GamePlayView } from "../GamePlayView.js";

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

const createPlayer = (name) => ({
  name,
  color: "#ffffff",
  handMatrix: [
    [
      { value: "X", image: "card-back.png" },
      { value: "X", image: "card-back.png" },
    ],
    [
      { value: "X", image: "card-back.png" },
      { value: "X", image: "card-back.png" },
    ],
  ],
});

const createBaseState = () => ({
  phase: "initial-flip",
  activePlayerIndex: null,
  activePlayer: null,
  initialFlip: {
    requiredReveals: 2,
    players: [
      {
        name: "Alice",
        color: null,
        flippedPositions: [],
        total: 0,
        completed: false,
      },
      {
        name: "Bob",
        color: null,
        flippedPositions: [],
        total: 0,
        completed: false,
      },
    ],
    resolved: false,
  },
  discard: { size: 0, topCard: null },
  drawnCard: null,
  finalRound: { inProgress: false, triggeredBy: null, pendingTurns: [] },
  pendingColumnRemovals: [],
  recentColumnRemovalEvents: [],
});

const createSnapshot = (stateOverrides = {}, logOverrides = []) => {
  const baseState = createBaseState();
  const normalizeEntry = (entry) => {
    if (entry && typeof entry === "object") {
      return {
        message:
          typeof entry.message === "string"
            ? entry.message
            : String(entry.message ?? ""),
        phase:
          typeof entry.phase === "string" && entry.phase.length
            ? entry.phase
            : null,
        actor:
          typeof entry.actor === "string" && entry.actor.trim().length
            ? entry.actor.trim()
            : null,
      };
    }
    return {
      message: typeof entry === "string" ? entry : String(entry ?? ""),
      phase: null,
      actor: null,
    };
  };

  return {
    players: [],
    logEntries: Array.isArray(logOverrides)
      ? logOverrides.map(normalizeEntry)
      : [],
    deck: { size: 0, topCard: null, discardSize: 0 },
    state: { ...baseState, ...stateOverrides },
  };
};

describe("GamePlayView information section", () => {
  beforeAll(() => {
    if (typeof global.ResizeObserver === "undefined") {
      global.ResizeObserver = ResizeObserverMock;
    }
  });

  it("prompts the local player to finish the initial flip", () => {
    const snapshot = createSnapshot();
    render(
      React.createElement(GamePlayView, {
        activePlayers: [createPlayer("Alice"), createPlayer("Bob")],
        deck: null,
        snapshot,
        sessionState: snapshot.state,
        localPlayerName: "Alice",
        logEntries: [],
      })
    );
    expect(screen.getByText("Preparation")).toBeInTheDocument();
    expect(
      screen.getByText(/reveal 2 more cards to determine turn order/i)
    ).toBeInTheDocument();
  });

  it("informs the viewer when waiting for another player during the main phase", () => {
    const snapshot = createSnapshot({
      phase: "main-play",
      activePlayerIndex: 1,
      activePlayer: { name: "Bob", color: null },
      drawnCard: null,
      initialFlip: {
        requiredReveals: 2,
        players: [
          {
            name: "Alice",
            color: null,
            flippedPositions: [0, 1],
            total: 3,
            completed: true,
          },
          {
            name: "Bob",
            color: null,
            flippedPositions: [0, 1],
            total: 7,
            completed: true,
          },
        ],
        resolved: true,
      },
    });
    render(
      React.createElement(GamePlayView, {
        activePlayers: [createPlayer("Alice"), createPlayer("Bob")],
        deck: { baseImage: "back.jpg", firstCard: null },
        snapshot,
        sessionState: snapshot.state,
        localPlayerName: "Alice",
        logEntries: [],
      })
    );
    expect(screen.getByText(/waiting for bob to play/i)).toBeInTheDocument();
  });

  it("shows the newest event at the top of the log when expanded", async () => {
    const snapshot = createSnapshot({}, [
      "Skyjo game started.",
      "Alice drew 3",
    ]);
    const user = userEvent.setup();
    render(
      React.createElement(GamePlayView, {
        activePlayers: [createPlayer("Alice"), createPlayer("Bob")],
        deck: { baseImage: "back.jpg", firstCard: null },
        snapshot,
        sessionState: snapshot.state,
        localPlayerName: "Alice",
        logEntries: snapshot.logEntries,
      })
    );
    expect(
      screen.queryByRole("list", { name: /game log entries/i })
    ).not.toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: /show log/i });
    await act(async () => {
      await user.click(toggle);
    });
    const log = await screen.findByRole("list", { name: /game log entries/i });
    const items = within(log).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Alice drew 3");
  });
});
