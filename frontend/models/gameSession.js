import { resolveLogger, noopLogger } from "../utils/logger.js";
import { Dealer } from "./dealer.js";
import { Player } from "./player.js";

/**
 * Wraps the core game flow so the UI can interact through a stable API.
 */
export class GameSession {
  #game;
  #dealer = null;
  #players = [];
  #logEntries = [];
  #deckSnapshot = null;
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
   * @returns {{ players: import("./player.js").Player[], logEntries: string[], deck: { size: number, topCard: { value: string | number, image: string, visible: boolean } | null } }}
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
    this.#dealer.deck.showFirstCard();

    this.#logger.info(
      `GameSession: dealer prepared deck with ${this.#dealer.deck.size()} cards`
    );

    this.#logEntries = GameSession.#buildInitialLog(
      this.#game,
      this.#dealer,
      this.#players
    );
    this.#deckSnapshot = GameSession.#buildDeckSnapshot(this.#dealer.deck);

    return {
      players: this.players,
      logEntries: this.logEntries,
      deck: this.deckSnapshot,
    };
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
    };
  }

  reset() {
    this.#dealer = null;
    this.#players = [];
    this.#logEntries = [];
    this.#deckSnapshot = null;
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
    const cards = deck.cardsDeck;
    const topCard = cards.length > 0 ? cards[0] : null;

    return {
      size: deck.size(),
      topCard: topCard
        ? {
            value: topCard.value,
            image: topCard.image,
            visible: topCard.value !== "X",
          }
        : null,
    };
  }
}
