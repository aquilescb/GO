// src/domains/game-go/lib/gameLogic.ts (o coordUtils.ts)

const letters = 'ABCDEFGHJKLMNOPQRST';

export function coordToXY(coord: string): { x: number; y: number } {
  const col = letters.indexOf(coord[0]);
  const row = 19 - parseInt(coord.slice(1), 10);
  return { x: col, y: row };
}

export function xyToCoord(x: number, y: number): string {
  const letter = letters[x];
  const number = 19 - y;
  return `${letter}${number}`;
}
