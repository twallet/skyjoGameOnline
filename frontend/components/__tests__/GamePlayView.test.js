import React from "react";
import { render, screen, within } from "@testing-library/react";

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
  return {
    players: [],
    logEntries: Array.isArray(logOverrides) ? [...logOverrides] : [],
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
    expect(
      screen.getByText(/initial flip: reveal 2 more cards/i)
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
    expect(
      screen.getByText(/main phase: waiting for bob to play/i)
    ).toBeInTheDocument();
  });

  it("shows the newest event at the top of the log", () => {
    const snapshot = createSnapshot({}, ["Game: Skyjo", "Alice drew 3"]);
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
    const log = screen.getByRole("list", { name: /event log entries/i });
    const items = within(log).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("Alice drew 3");
  });
});
