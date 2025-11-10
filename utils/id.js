const DEFAULT_ROOM_ID_LENGTH = 6;
const ROOM_ID_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

/**
 * Generate a pseudo-random identifier suitable for room codes.
 * @param {number} length
 * @returns {string}
 */
export function generateRoomId(length = DEFAULT_ROOM_ID_LENGTH) {
  if (!Number.isInteger(length) || length <= 0) {
    throw new TypeError("Room id length must be a positive integer");
  }

  let id = "";
  for (let i = 0; i < length; i++) {
    const index = Math.floor(Math.random() * ROOM_ID_ALPHABET.length);
    id += ROOM_ID_ALPHABET[index];
  }
  return id;
}
