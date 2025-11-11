export function serializeSnapshot(snapshot) {
  return {
    players: snapshot.players.map(serializePlayerForClient),
    logEntries: [...snapshot.logEntries],
    deck: serializeDeck(snapshot.deck),
  };
}

function serializePlayerForClient(player) {
  return {
    name: player.name,
    color: player.color,
    hand: {
      size: player.hand.size,
      lines: player.hand.lines,
      matrix: player.hand.cardsMatrix(),
    },
  };
}

function serializeDeck(deckSnapshot) {
  if (!deckSnapshot) {
    return { size: 0, topCard: null };
  }

  const { size = 0, topCard = null } = deckSnapshot;

  return {
    size,
    topCard: topCard
      ? {
          value: topCard.value,
          image: topCard.image,
          visible: Boolean(topCard.visible),
        }
      : null,
  };
}

