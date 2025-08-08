import type { StoneMap, StoneColor } from '@/domains/game-go/types/game';

export interface PriorityArea {
  blackPriority: number;
  whitePriority: number;
  criticalForBoth: boolean;
}

export type PriorityGrid = Record<string, PriorityArea>;

/**
 * Evalúa urgencia estratégica para cada intersección vacía.
 */
export function calculatePriorityMap(stones: StoneMap, boardSize = 19): PriorityGrid {
  const priorityGrid: PriorityGrid = {};

  for (let x = 0; x < boardSize; x++) {
    for (let y = 0; y < boardSize; y++) {
      const pos = `${x},${y}`;
      if (stones[pos]) continue;

      let blackPriority = 0;
      let whitePriority = 0;

      const nearby = getSurroundingStones(x, y, stones, boardSize);

      const blackNearby = nearby.filter(s => s.color === 'black').length;
      const whiteNearby = nearby.filter(s => s.color === 'white').length;

      // Si hay más piedras de un color, asumimos que es zona crítica para el otro
      if (blackNearby >= 2 && whiteNearby === 0) whitePriority += 80;
      if (whiteNearby >= 2 && blackNearby === 0) blackPriority += 80;

      // Si hay ambos cerca, es crítica para ambos
      const criticalForBoth = blackNearby >= 1 && whiteNearby >= 1;

      if (criticalForBoth) {
        blackPriority = Math.max(blackPriority, 90);
        whitePriority = Math.max(whitePriority, 90);
      }

      // Como mínimo, si está libre y cerca de algo, dar prioridad media
      if (blackNearby > 0 || whiteNearby > 0) {
        if (blackPriority === 0) blackPriority = 50;
        if (whitePriority === 0) whitePriority = 50;
      }

      if (blackPriority || whitePriority) {
        priorityGrid[pos] = {
          blackPriority: Math.min(blackPriority, 100),
          whitePriority: Math.min(whitePriority, 100),
          criticalForBoth
        };
      }
    }
  }

  return priorityGrid;
}

function getSurroundingStones(
  x: number,
  y: number,
  stones: StoneMap,
  boardSize: number
): { x: number; y: number; color: StoneColor }[] {
  const result: { x: number; y: number; color: StoneColor }[] = [];

  for (let dx = -2; dx <= 2; dx++) {
    for (let dy = -2; dy <= 2; dy++) {
      const nx = x + dx;
      const ny = y + dy;
      const pos = `${nx},${ny}`;
      if (
        dx === 0 && dy === 0 ||
        nx < 0 || ny < 0 || nx >= boardSize || ny >= boardSize
      ) continue;

      const stone = stones[pos];
      if (stone) {
        result.push({ x: nx, y: ny, color: stone });
      }
    }
  }

  return result;
}
