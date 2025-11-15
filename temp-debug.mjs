import { Game } from "./shared/models/game.js";
import { GameSession } from "./shared/models/gameSession.js";
import { Card } from "./shared/models/card.js";

const skyjo = new Game(
  "Skyjo",
  [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  [5, 10, 15, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  [
    "./assets/images/minus2.jpg",
    "./assets/images/minus1.jpg",
    "./assets/images/0.jpg",
    "./assets/images/1.jpg",
    "./assets/images/2.jpg",
    "./assets/images/3.jpg",
    "./assets/images/4.jpg",
    "./assets/images/5.jpg",
    "./assets/images/6.jpg",
    "./assets/images/7.jpg",
    "./assets/images/8.jpg",
    "./assets/images/9.jpg",
    "./assets/images/10.jpg",
    "./assets/images/11.jpg",
    "./assets/images/12.jpg",
  ],
  "./assets/images/back.jpg",
  12,
  4,
  2,
  8
);

const session = new GameSession(skyjo);
session.start(["Alice", "Bob"]);
["Alice", "Bob"].forEach((name) => {
  session.revealInitialCard(name, 0);
  session.revealInitialCard(name, 1);
});
const [alice] = session.players;
const revealAllButLast = (hand) => {
  const lastIndex = hand.size - 1;
  for (let index = 0; index < hand.size; index += 1) {
    if (index === lastIndex || hand.isCardVisible(index)) {
      continue;
    }
    hand.revealCard(index);
  }
  return lastIndex;
};
const aliceFinalIndex = revealAllButLast(alice.hand);
const ensureHiddenIndex = (hand) => {
  for (let index = 0; index < hand.size; index += 1) {
    if (!hand.isCardVisible(index)) {
      return index;
    }
  }
  return 0;
};
const deck = session.dealer.deck;
deck.add(new Card(4, skyjo));
deck.add(new Card(3, skyjo));
session.drawCard("Alice", "deck");
session.discardDrawnCardAndReveal("Alice", aliceFinalIndex);
const nextSnapshot = session.getSnapshot();
console.log('snapshot', {
  phase: nextSnapshot.state?.phase,
  activePlayerIndex: nextSnapshot.state?.activePlayerIndex,
  activePlayer: nextSnapshot.state?.activePlayer,
  pendingTurns: nextSnapshot.state?.finalRound?.pendingTurns,
});
const nextPlayerIndex = nextSnapshot.state?.activePlayerIndex;
const nextPlayer = Number.isInteger(nextPlayerIndex)
  ? session.players[nextPlayerIndex]
  : null;
if (nextPlayer) {
  console.log('acting as', nextPlayer.name);
  session.drawCard(nextPlayer.name, 'deck');
  const idx = ensureHiddenIndex(nextPlayer.hand);
  session.discardDrawnCardAndReveal(nextPlayer.name, idx);
  const finalSnapshot = session.getSnapshot();
  console.log('final phase', finalSnapshot.state?.phase);
}
