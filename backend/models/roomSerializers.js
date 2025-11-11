export function serializeSnapshot(snapshot) {
  return {
    players: snapshot.players.map(serializePlayerForClient),
    logEntries: [...snapshot.logEntries],
    deck: serializeDeck(snapshot.deck),
    state: snapshot.state ? serializeState(snapshot.state) : null,
  };
}

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
    },
  };
}

function cloneMatrix(matrix) {
  return matrix.map((row) =>
    row.map((card) => (card && typeof card === "object" ? { ...card } : card))
  );
}
