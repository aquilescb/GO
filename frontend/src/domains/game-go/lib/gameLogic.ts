import type { Move, Board, Color, StoneColor} from "@/domains/game-go/types/game";
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

export function countStones(board: Board): Record<Color, number>  {
  // Inicializa contador
  let black = 0;
  let white = 0;

  // Lógica muy básica:
  // Contá cuántas piedras tiene cada jugador (como primera versión)
  for (let row of board) {
    for (let stone of row) {
      if (stone === "black") black++;
      if (stone === "white") white++;
    }
  }

  return { black, white };
}


export function getGroup(board: Board, x: number, y: number): [number, number][] {
  const targetColor = board[y][x];
  if (!targetColor) return [];

  const visited = new Set<string>();
  const group: [number, number][] = [];
  const stack: [number, number][] = [[x, y]];

  while (stack.length > 0) {
    const [cx, cy] = stack.pop()!;
    const key = `${cx},${cy}`;
    if (visited.has(key)) continue;

    visited.add(key);
    group.push([cx, cy]);

    const neighbors = getNeighbors(board, cx, cy);
    for (const [nx, ny] of neighbors) {
      if (board[ny][nx] === targetColor && !visited.has(`${nx},${ny}`)) {
        stack.push([nx, ny]);
      }
    }
  }

  return group;
}

function getNeighbors(board: Board, x: number, y: number): [number, number][] {
  const deltas = [
    [0, -1], [1, 0], [0, 1], [-1, 0]
  ];
  const neighbors: [number, number][] = [];

  for (const [dx, dy] of deltas) {
    const nx = x + dx;
    const ny = y + dy;
    if (ny >= 0 && ny < board.length && nx >= 0 && nx < board[0].length) {
      neighbors.push([nx, ny]);
    }
  }

  return neighbors;
}
export function hasLiberties(board: Board, group: [number, number][]): boolean {
  for (const [x, y] of group) {
    const neighbors = getNeighbors(board, x, y);
    for (const [nx, ny] of neighbors) {
      if (board[ny][nx] === null) {
        return true; // hay libertad
      }
    }
  }
  return false; // atrapado
}

export function removeCapturedStones(board: Board, move: Move): Board {
  const { x, y, color } = move;
  const opponentColor: StoneColor = color === "black" ? "white" : "black";

  let newBoard = board.map(row => [...row]); // clonamos el board

  const neighbors = getNeighbors(board, x, y);
  for (const [nx, ny] of neighbors) {
    if (board[ny][nx] === opponentColor) {
      const group = getGroup(board, nx, ny);
      if (!hasLiberties(board, group)) {
        for (const [gx, gy] of group) {
          newBoard[gy][gx] = null;
        }
      }
    }
  }

  return newBoard;
}
export function buildBoardFromMoves(moves: Move[], size = 19): Board {
  const board: Board = Array.from({ length: size }, () => Array(size).fill(null));

  for (const move of moves) {
    board[move.y][move.x] = move.color;
  }

  return board;
}

export function isSuicidalMove(board: Board, move: Move): boolean {
  const { x, y, color } = move;

  // Simulamos colocar la piedra
  const simulated = board.map((row) => [...row]);
  simulated[y][x] = color;

  // Aplicamos la lógica de captura: si al poner la piedra, se capturan enemigos
  const afterCapture = removeCapturedStones(simulated, move);

  // Obtenemos el grupo donde está la piedra jugada
  const group = getGroup(afterCapture, x, y);

  // Verificamos si ese grupo tiene libertades
  const stillAlive = hasLiberties(afterCapture, group);

  return !stillAlive;
}
