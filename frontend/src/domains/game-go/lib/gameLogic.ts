import type { Move } from "@/domains/game-go/types/game";
//Devuelve true si la posición (x, y) está ocupada por alguna piedra
export const isOccupied = (
  stones: Move[],
  x: number,
  y: number
): boolean => {
  return stones.some((stone) => stone.x === x && stone.y === y);
};
//Devuelve un array de todas las coordenadas libres del tablero, es decir, todas las posiciones no ocupadas por ninguna piedra
export const getAvailableMoves = (stones: Move[], boardSize: number): { x: number; y: number }[] => {
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
