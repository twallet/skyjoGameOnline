import { resolveLogger, noopLogger } from "../utils/logger.js";
import { Dealer } from "./dealer.js";
import { Player } from "./player.js";
import { SkyjoEngine } from "./skyjoEngine.js";

/**
 * Wraps the core game flow so the UI can interact through a stable API.
 */
export class GameSession {
  #game;
  #dealer = null;
  #players = [];
  #logEntries = [];
  #deckSnapshot = null;
  #engine = null;
  #lastSnapshot = null;
  static #MAX_PLAYER_NAME_LENGTH = 15;
  #logger;

  constructor(game, logger = noopLogger) {
    this.#game = GameSession.#validateGame(game);
    this.#logger = resolveLogger(logger);
  }

  /**
   * Start a new session with the provided player names and optional colors.
   * @param {string[]} playerNames
   * @param {string[]} playerColors
   * @returns {{
   *   players: Array<{
   *     name: string,
   *     color: string | null,
   *     hand: {
   *       size: number,
   *       lines: number,
   *       matrix: Array<Array<{ value: string | number, image: string }>>
   *     }
   *   }>,
   *   logEntries: string[],
   *   deck: { size: number, topCard: { value: string | number, image: string, visible: boolean } | null, discardSize: number },
   *   state: ReturnType<import("./skyjoEngine.js").SkyjoEngine["buildStateSnapshot"]> | null
   * }}
   */
  start(playerNames, playerColors = []) {
    const names = GameSession.#validatePlayerNames(
      playerNames,
      this.#game.minPlayers,
      this.#game.maxPlayers
    );

    this.#players = names.map((name, index) => {
      const color =
        playerColors.length > 0
          ? playerColors[index % playerColors.length]
          : null;
      return new Player(name, this.#game, color ?? undefined);
    });

    this.#logger.info(
      `GameSession: starting ${this.#game.name} for players ${this.#players
        .map((player) => player.name)
        .join(", ")}`
    );

    this.#dealer = new Dealer(this.#game, this.#players);
    this.#dealer.shuffle();
    this.#dealer.deal();
    this.#engine = new SkyjoEngine(
      this.#game,
      this.#dealer,
      this.#players,
      this.#logger
    );

    this.#logger.info(
      `GameSession: dealer prepared deck with ${this.#dealer.deck.size()} cards`
    );

    this.#logEntries = GameSession.#buildInitialLog(
      this.#game,
      this.#dealer,
      this.#players
    );
    const snapshot = this.#buildSessionSnapshot();
    this.#deckSnapshot = snapshot.deck;
    this.#lastSnapshot = GameSession.#cloneSnapshot(snapshot);

    return GameSession.#cloneSnapshot(snapshot);
  }

  get dealer() {
    return this.#dealer;
  }

  get players() {
    return [...this.#players];
  }

  get logEntries() {
    return [...this.#logEntries];
  }

  get deckSnapshot() {
    if (!this.#deckSnapshot) {
      return { size: 0, topCard: null };
    }
    return {
      size: this.#deckSnapshot.size,
      topCard: this.#deckSnapshot.topCard
        ? { ...this.#deckSnapshot.topCard }
        : null,
      discardSize: this.#deckSnapshot.discardSize ?? 0,
    };
  }

  getSnapshot() {
    if (!this.#lastSnapshot) {
      return null;
    }

    return GameSession.#cloneSnapshot(this.#lastSnapshot);
  }

  reset() {
    this.#dealer = null;
    this.#players = [];
    this.#logEntries = [];
    this.#deckSnapshot = null;
    this.#engine = null;
    this.#lastSnapshot = null;
    this.#logger.info("GameSession: reset complete");
  }

  /**
   * Validate and return an updated list of player names including the new one.
   * @param {string[]} currentNames
   * @param {string} rawName
   * @returns {string[]}
   */
  addPlayer(currentNames, rawName) {
    if (!Array.isArray(currentNames)) {
      throw new TypeError("Current player names must be provided as an array");
    }

    if (currentNames.length >= this.#game.maxPlayers) {
      throw new Error(
        `You cannot add more than ${this.#game.maxPlayers} players to the game.`
      );
    }

    const trimmed = GameSession.#validatePlayerName(rawName);

    if (currentNames.includes(trimmed)) {
      throw new Error("Player name must be unique.");
    }

    return [...currentNames, trimmed];
  }

  /**
   * Determine if the game can start with the provided player count.
   * @param {number} playerCount
   * @returns {boolean}
   */
  canStartGame(playerCount) {
    return (
      Number.isInteger(playerCount) && playerCount >= this.#game.minPlayers
    );
  }

  /**
   * Determine if more players can join given the current count.
   * @param {number} playerCount
   * @returns {boolean}
   */
  canAddPlayer(playerCount) {
    return Number.isInteger(playerCount) && playerCount < this.#game.maxPlayers;
  }

  static #validateGame(game) {
    if (!game || typeof game !== "object") {
      throw new TypeError("GameSession requires a game definition object");
    }

    if (
      typeof game.minPlayers !== "number" ||
      typeof game.maxPlayers !== "number"
    ) {
      throw new TypeError(
        "GameSession requires the game to define minPlayers and maxPlayers"
      );
    }

    return game;
  }

  static #validatePlayerNames(names, minPlayers, maxPlayers) {
    if (!Array.isArray(names)) {
      throw new TypeError("Player names must be provided as an array");
    }

    const trimmed = names.map((name, index) =>
      GameSession.#validatePlayerName(name, index)
    );

    if (trimmed.length < minPlayers) {
      throw new Error(
        `You must provide at least ${minPlayers} players to start the game`
      );
    }

    if (trimmed.length > maxPlayers) {
      throw new Error(
        `You cannot provide more than ${maxPlayers} players for this game`
      );
    }

    return trimmed;
  }

  static #validatePlayerName(name, index = null) {
    if (typeof name !== "string") {
      const label =
        index === null ? "Player name" : `Player name at index ${index}`;
      throw new TypeError(`${label} must be a string`);
    }

    const cleaned = name.trim();
    if (!cleaned) {
      const label =
        index === null ? "Player name" : `Player name at index ${index}`;
      throw new TypeError(`${label} must not be empty`);
    }

    if (cleaned.length > GameSession.#MAX_PLAYER_NAME_LENGTH) {
      throw new Error(
        `Player name must not exceed ${GameSession.#MAX_PLAYER_NAME_LENGTH} characters.`
      );
    }

    return cleaned;
  }

  static #buildInitialLog(game, dealer, players) {
    const entries = players.map(
      (player) => `${player.name}: ${player.hand.show()}`
    );
    return [
      `Game: ${game.name}`,
      `Players: ${players.map((player) => player.name).join(", ")}`,
      ...entries,
      `${dealer.deck.size()} cards in deck.`,
    ];
  }

  static #buildDeckSnapshot(deck) {
    if (!deck) {
      return { size: 0, topCard: null, discardSize: 0 };
    }

    const cards = deck.cardsDeck;
    const topCard = cards.length > 0 ? cards[cards.length - 1] : null;

    return {
      size: deck.size(),
      topCard: topCard
        ? {
            value: topCard.value,
            image: topCard.image,
            visible: topCard.value !== "X",
          }
        : null,
      discardSize: 0,
    };
  }

  #buildSessionSnapshot() {
    const players = this.#players.map((player) => ({
      name: player.name,
      color: player.color,
      hand: {
        size: player.hand.size,
        lines: player.hand.lines,
        matrix: player.hand
          .cardsMatrix()
          .map((row) => row.map((card) => ({ ...card }))),
      },
    }));

    const deck = this.#engine
      ? this.#engine.buildDeckSnapshot()
      : GameSession.#buildDeckSnapshot(this.#dealer?.deck ?? null);

    const state = this.#engine ? this.#engine.buildStateSnapshot() : null;

    return {
      players,
      logEntries: [...this.#logEntries],
      deck,
      state: state ? GameSession.#cloneStateSnapshot(state) : null,
    };
  }

  static #cloneSnapshot(snapshot) {
    return {
      players: snapshot.players.map((player) => ({
        name: player.name,
        color: player.color,
        hand: {
          size: player.hand.size,
          lines: player.hand.lines,
          matrix: player.hand.matrix.map((row) =>
            row.map((card) => ({ ...card }))
          ),
        },
      })),
      logEntries: [...snapshot.logEntries],
      deck: {
        size: snapshot.deck.size,
        topCard: snapshot.deck.topCard ? { ...snapshot.deck.topCard } : null,
        discardSize: snapshot.deck.discardSize ?? 0,
      },
      state: snapshot.state
        ? GameSession.#cloneStateSnapshot(snapshot.state)
        : null,
    };
  }

  static #cloneStateSnapshot(state) {
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
}
