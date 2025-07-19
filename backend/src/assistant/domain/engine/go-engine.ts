import { Move, Stone, EngineEvaluation } from '../types/assistant.types';
import { GroupAnalyzer } from './group-analyzer';

export class GoEngine {

    private groupAnalyzer = new GroupAnalyzer();

    evaluateBoard(board: Stone[][], move: Move): EngineEvaluation {
        const groupsInAtari = this.groupAnalyzer.getGroupsInAtari(board, 1);
        const groups = this.groupAnalyzer.analyzeGroups(board);
        const overconcentrated = this.detectOverconcentration(board, move);
        const groupOfMove = groups.find(group =>
        group.stones.some(s => s.x === move.x && s.y === move.y)
        );
        const liberties = groupOfMove?.liberties ?? 0;
    
        const territoryEstimate = this.estimateTerritory(board);
        const isAtari = liberties === 1;
        const connected = this.detectConnectionMove(board, move);
        const eye = this.createsPotentialEye(board, move);
        const threatens = this.threatensCapture(board, move);

        return {
        liberties,
        territoryEstimate,
        isAtari,
        riskLevel: this.getRiskLevel(liberties),
        groupsInAtari,
        overconcentrated,
        connectsGroups: connected,
        createsEye: eye,
        threatensCapture: threatens,
        };
    }


    private estimateTerritory(board: Stone[][]): { black: number; white: number } {
        let black = 0;
        let white = 1;

        for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
            const cell = board[y][x];
            if (cell === 'black') black++;
            if (cell === 'white') white++;
        }
        }

        return { black, white };
    }

    private getRiskLevel(liberties: number): 'low' | 'medium' | 'high' {
        if (liberties >= 4) return 'low';
        if (liberties >= 2) return 'medium';
        return 'high';
    }

    detectOverconcentration(board: ('black' | 'white' | null)[][], move: Move): boolean {
    const radius = 2;
    const { x, y, color } = move;

    let nearbyAllies = 0;

    for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
        if (dx === 0 && dy === 0) continue;

        const nx = x + dx;
        const ny = y + dy;
        if (board[ny]?.[nx] === color) nearbyAllies++;
        }
    }

    return nearbyAllies >= 6;
}
detectConnectionMove(board: Stone[][], move: Move): boolean {
  const { x, y, color } = move;
  const visited = new Set<string>();
  const connectedGroups = new Set<string>();

  const directions = [
    [0, -1], [0, 1], [-1, 0], [1, 0],
    [-1, -1], [1, -1], [-1, 1], [1, 1] // incluye diagonales
  ];

  for (const [dx, dy] of directions) {
    const nx = x + dx;
    const ny = y + dy;
    const neighbor = board[ny]?.[nx];
    if (neighbor === color) {
      connectedGroups.add(`${nx},${ny}`);
    }
  }

  return connectedGroups.size >= 2;
}
createsPotentialEye(board: Stone[][], move: Move): boolean {
  const { x, y, color } = move;
  const directions = [
    [0, -1], [0, 1], [-1, 0], [1, 0],
  ];

  let surrounded = 0;

  for (const [dx, dy] of directions) {
    const nx = x + dx;
    const ny = y + dy;
    const neighbor = board[ny]?.[nx];
    if (neighbor === color) surrounded++;
  }

  return surrounded >= 3; // podría ser un ojo si tiene buen contexto
}
threatensCapture(board: Stone[][], move: Move): boolean {
  const { x, y, color } = move;
  const enemyColor = color === 'black' ? 'white' : 'black';

  const directions = [
    [0, -1], [0, 1], [-1, 0], [1, 0],
  ];

  for (const [dx, dy] of directions) {
    const nx = x + dx;
    const ny = y + dy;
    const neighbor = board[ny]?.[nx];

    if (neighbor === enemyColor) {
      const liberties = this.countLibertiesOfGroup(board, nx, ny);
      if (liberties === 1) return true;
    }
  }

  return false;
}

// Helper:
private countLibertiesOfGroup(board: Stone[][], x: number, y: number): number {
  const color = board[y]?.[x];
  if (!color) return 0;
  const visited = new Set<string>();
  const liberties = new Set<string>();
  const stack = [{ x, y }];

  while (stack.length) {
    const { x: cx, y: cy } = stack.pop()!;
    const key = `${cx},${cy}`;
    if (visited.has(key)) continue;
    visited.add(key);

    const neighbors = [
      [cx - 1, cy], [cx + 1, cy],
      [cx, cy - 1], [cx, cy + 1],
    ];

    for (const [nx, ny] of neighbors) {
      const neighbor = board[ny]?.[nx];
      if (neighbor === null) {
        liberties.add(`${nx},${ny}`);
      } else if (neighbor === color) {
        stack.push({ x: nx, y: ny });
      }
    }
  }

  return liberties.size;
}

}
