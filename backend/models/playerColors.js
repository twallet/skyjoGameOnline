export function buildPlayerColors(maxPlayers) {
  return Array.from({ length: maxPlayers }, (_, index) => {
    const hue = Math.round((index * 360) / maxPlayers);
    return `hsl(${hue}, 70%, 85%)`;
  });
}

