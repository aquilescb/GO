// gameLogic.ts
export const isOccupied = (
  stones: { x: number; y: number }[],
  x: number,
  y: number
): boolean => {
  return stones.some((stone) => stone.x === x && stone.y === y);
};

export const getAvailableMoves = (
  stones: { x: number; y: number }[],
  boardSize: number
): { x: number; y: number }[] => {
  const moves: { x: number; y: number }[] = [];
  for (let x = 0; x < boardSize; x++) {
    for (let y = 0; y < boardSize; y++) {
      if (!isOccupied(stones, x, y)) {
        moves.push({ x, y });
      }
    }
  }
  return moves;
};
