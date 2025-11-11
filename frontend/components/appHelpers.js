const DECK_BASE_IMAGE = "./assets/images/deck.png";

export function buildDeckView(deckSnapshot) {
  if (!deckSnapshot) {
    return null;
  }

  const topCard = deckSnapshot.topCard ?? null;
  return {
    size: deckSnapshot.size ?? 0,
    baseImage: DECK_BASE_IMAGE,
    firstCard: topCard
      ? {
          image: topCard.image,
          visible: Boolean(topCard.visible),
          alt: topCard.visible
            ? `Top card ${topCard.value}`
            : "Hidden top card",
        }
      : null,
  };
}

export function normalizePlayerSnapshots(players) {
  if (!Array.isArray(players)) {
    return [];
  }

  return players.map((player) => ({
    name: player?.name,
    color: player?.color ?? null,
    handMatrix: Array.isArray(player?.hand?.matrix) ? player.hand.matrix : [],
  }));
}

export { DECK_BASE_IMAGE };
