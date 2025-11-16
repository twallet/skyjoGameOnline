// Generates a palette of distinct colors evenly distributed around the HSL color wheel.
// Each player gets a unique hue while maintaining consistent saturation and lightness.
export function buildPlayerColors(maxPlayers) {
  return Array.from({ length: maxPlayers }, (_, index) => {
    // Distribute hues evenly across 360 degrees (e.g., 0°, 45°, 90° for 8 players).
    const hue = Math.round((index * 360) / maxPlayers);
    return `hsl(${hue}, 70%, 85%)`;
  });
}

