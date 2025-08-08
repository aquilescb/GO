import type { StoneMap, StoneColor } from '@/domains/game-go/types/game';

export interface TerritoryResult {
  territory: Record<string, { owner: StoneColor; distance: number }>;
  threats: { color: StoneColor; positions: [number, number][]; liberties: number }[];
}

/**
 * Calcula el dueño del territorio cercano y encuentra grupos amenazados.
 */
export function analyzeTerritoryAndThreats(stones: StoneMap, boardSize = 19): TerritoryResult {
  const territory: TerritoryResult['territory'] = {};
  const threats: TerritoryResult['threats'] = [];
  const checked = new Set<string>();

  // Detectar territorio cercano según piedra más cercana
  for (let x = 0; x < boardSize; x++) {
    for (let y = 0; y < boardSize; y++) {
      const pos = `${x},${y}`;
      if (stones[pos]) continue;

      let closestDistance = Infinity;
      let owner: StoneColor | null = null;

      for (const [stonePos, color] of Object.entries(stones)) {
        const [sx, sy] = stonePos.split(',').map(Number);
        const distance = Math.abs(x - sx) + Math.abs(y - sy);

        if (distance < closestDistance && distance <= 3) {
          closestDistance = distance;
          owner = color;
        }
      }

      if (owner && closestDistance <= 2) {
        territory[pos] = { owner, distance: closestDistance };
      }
    }
  }

  // Detectar grupos con 1 o 2 libertades (amenaza)
  for (const [pos, color] of Object.entries(stones)) {
    if (checked.has(pos)) continue;

    const [x, y] = pos.split(',').map(Number);
    const group = getConnectedGroup(x, y, color, stones, boardSize);
    const liberties = countLiberties(group, stones, boardSize);

    group.forEach(([gx, gy]) => checked.add(`${gx},${gy}`));

    if (liberties <= 2) {
      threats.push({ color, positions: group, liberties });
    }
  }

  return { territory, threats };
}

function getConnectedGroup(
  startX: number,
  startY: number,
  color: StoneColor,
  stones: StoneMap,
  boardSize: number
): [number, number][] {
  const group: [number, number][] = [];
  const visited = new Set<string>();
  const stack: [number, number][] = [[startX, startY]];

  while (stack.length > 0) {
    const [x, y] = stack.pop()!;
    const pos = `${x},${y}`;
    if (visited.has(pos) || stones[pos] !== color) continue;

    visited.add(pos);
    group.push([x, y]);

    for (const [dx, dy] of [[0,1],[1,0],[0,-1],[-1,0]]) {
      const nx = x + dx;
      const ny = y + dy;
      const npos = `${nx},${ny}`;
      if (nx >= 0 && ny >= 0 && nx < boardSize && ny < boardSize && !visited.has(npos)) {
        stack.push([nx, ny]);
      }
    }
  }

  return group;
}

function countLiberties(
  group: [number, number][],
  stones: StoneMap,
  boardSize: number
): number {
  const liberties = new Set<string>();
  for (const [x, y] of group) {
    for (const [dx, dy] of [[0,1],[1,0],[0,-1],[-1,0]]) {
      const nx = x + dx;
      const ny = y + dy;
      const pos = `${nx},${ny}`;
      if (nx >= 0 && ny >= 0 && nx < boardSize && ny < boardSize && !stones[pos]) {
        liberties.add(pos);
      }
    }
  }
  return liberties.size;
}
