// Exposes the full room/game snapshot as JSON-safe data for clients.
export function serializeSnapshot(snapshot) {
  return {
    players: snapshot.players.map(serializePlayerForClient),
    logEntries: [...snapshot.logEntries],
    deck: serializeDeck(snapshot.deck),
    state: snapshot.state ? serializeState(snapshot.state) : null,
  };
}

// Normalizes a player payload so the frontend can render the hand matrix.
function serializePlayerForClient(player) {
  const matrix = Array.isArray(player.hand?.matrix)
    ? cloneMatrix(player.hand.matrix)
    : typeof player.hand?.cardsMatrix === "function"
      ? cloneMatrix(player.hand.cardsMatrix())
      : [];

  return {
    name: player.name,
    color: player.color,
    hand: {
      size: player.hand.size,
      lines: player.hand.lines,
      matrix,
    },
  };
}

// Safely captures deck metadata while omitting live references.
function serializeDeck(deckSnapshot) {
  if (!deckSnapshot) {
    return { size: 0, topCard: null, discardSize: 0 };
  }

  const { size = 0, topCard = null, discardSize = 0 } = deckSnapshot;

  return {
    size,
    topCard: topCard
      ? {
          value: topCard.value,
          image: topCard.image,
          visible: Boolean(topCard.visible),
        }
      : null,
    discardSize,
  };
}

// Converts the complex state tree into immutable structures.
function serializeState(state) {
  return {
    phase: state.phase,
    activePlayerIndex: state.activePlayerIndex,
    activePlayer: state.activePlayer ? { ...state.activePlayer } : null,
    initialFlip: {
      requiredReveals: state.initialFlip.requiredReveals,
      resolved: state.initialFlip.resolved,
      players: state.initialFlip.players.map((player) => ({
        name: player.name,
        color: player.color,
        flippedPositions: [...player.flippedPositions],
        total: player.total,
        completed: player.completed,
      })),
    },
    discard: {
      size: state.discard.size,
      topCard: state.discard.topCard ? { ...state.discard.topCard } : null,
    },
    drawnCard: state.drawnCard ? { ...state.drawnCard } : null,
    finalRound: {
      inProgress: state.finalRound.inProgress,
      triggeredBy: state.finalRound.triggeredBy,
      pendingTurns: [...state.finalRound.pendingTurns],
      scores: Array.isArray(state.finalRound.scores)
        ? state.finalRound.scores.map((entry) => ({ ...entry }))
        : [],
      winner:
        typeof state.finalRound.winner === "string"
          ? state.finalRound.winner
          : null,
    },
    pendingColumnRemovals: Array.isArray(state.pendingColumnRemovals)
      ? state.pendingColumnRemovals.map((entry) => ({
          playerIndex: entry.playerIndex ?? null,
          playerName: entry.playerName ?? null,
          columns: Array.isArray(entry.columns) ? [...entry.columns] : [],
          values: Array.isArray(entry.values) ? [...entry.values] : [],
          expiresAt:
            typeof entry.expiresAt === "number" ? entry.expiresAt : null,
          startedAt:
            typeof entry.startedAt === "number" ? entry.startedAt : null,
        }))
      : [],
  };
}

// Deeply clones card matrices to avoid leaking live objects.
function cloneMatrix(matrix) {
  return matrix.map((row) =>
    row.map((card) => (card && typeof card === "object" ? { ...card } : card))
  );
}
