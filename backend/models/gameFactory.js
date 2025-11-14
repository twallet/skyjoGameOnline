import { Game } from "../../shared/models/game.js";

const SKYJO_CARD_IMAGES = [
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
];

const SKYJO_CONFIGURATION = {
  name: "Skyjo",
  values: [-2, -1, 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
  quantities: [5, 10, 15, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  backImage: "./assets/images/back.jpg",
  handSize: 12,
  lines: 4,
  minPlayers: 2,
  maxPlayers: 8,
};

export function createSkyjoGame() {
  return new Game(
    SKYJO_CONFIGURATION.name,
    SKYJO_CONFIGURATION.values,
    SKYJO_CONFIGURATION.quantities,
    SKYJO_CARD_IMAGES,
    SKYJO_CONFIGURATION.backImage,
    SKYJO_CONFIGURATION.handSize,
    SKYJO_CONFIGURATION.lines,
    SKYJO_CONFIGURATION.minPlayers,
    SKYJO_CONFIGURATION.maxPlayers
  );
}
