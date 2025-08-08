import type { StoneMap } from '@/domains/game-go/types/game';

export type InfluenceGrid = Record<string, { black: number; white: number }>;

/**
 * Calcula el mapa de influencia basado en las piedras actuales.
 */
export function calculateInfluence(stones: StoneMap): InfluenceGrid {
  const influenceGrid: InfluenceGrid = {};

  for (const [pos, color] of Object.entries(stones)) {
    const [sx, sy] = pos.split(',').map(Number);

    for (let radius = 1; radius <= 5; radius++) {
      for (let x = Math.max(0, sx - radius); x <= Math.min(18, sx + radius); x++) {
        for (let y = Math.max(0, sy - radius); y <= Math.min(18, sy + radius); y++) {
          const distance = Math.abs(x - sx) + Math.abs(y - sy);
          if (distance === radius && distance <= 5) {
            const key = `${x},${y}`;
            if (!stones[key]) {
              const influence = (6 - radius) / 5 * 0.6;
              if (!influenceGrid[key]) {
                influenceGrid[key] = { black: 0, white: 0 };
              }
              influenceGrid[key][color] += influence;
            }
          }
        }
      }
    }
  }

  return influenceGrid;
}
