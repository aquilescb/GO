import { useCallback } from "react";

export function useBotPlayer(boardSize: number) {
  const getAvailableMoves = useCallback((stones: { x: number; y: number }[]) => {
    const available: { x: number; y: number }[] = [];
    for (let x = 0; x < boardSize; x++) {
      for (let y = 0; y < boardSize; y++) {
        if (!stones.some((stone) => stone.x === x && stone.y === y)) {
          available.push({ x, y });
        }
      }
    }
    return available;
  }, [boardSize]);

  const getRandomMove = useCallback((stones: { x: number; y: number }[]) => {
    const moves = getAvailableMoves(stones);
    if (moves.length === 0) return null;
    return moves[Math.floor(Math.random() * moves.length)];
  }, [getAvailableMoves]);

  return { getRandomMove };
}
