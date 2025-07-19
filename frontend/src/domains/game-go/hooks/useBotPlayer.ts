import { useCallback } from "react";
import type { Move, Board } from "@/domains/game-go/types/game";
import {
  buildBoardFromMoves,
  removeCapturedStones,
  getGroup,
  hasLiberties,
} from "@/domains/game-go/lib/gameLogic";

export function useBotPlayer(boardSize: number) {
  // Mezcla aleatoria
  const shuffle = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  // Jugadas disponibles
  const getAvailableMoves = useCallback(
    (stones: { x: number; y: number }[]) => {
      const available: { x: number; y: number }[] = [];
      for (let x = 0; x < boardSize; x++) {
        for (let y = 0; y < boardSize; y++) {
          if (!stones.some((stone) => stone.x === x && stone.y === y)) {
            available.push({ x, y });
          }
        }
      }
      return available;
    },
    [boardSize]
  );

  const getRandomMove = useCallback(
    (stones: { x: number; y: number }[]) => {
      const moves = getAvailableMoves(stones);
      if (moves.length === 0) return null;
      return moves[Math.floor(Math.random() * moves.length)];
    },
    [getAvailableMoves]
  );

  // Filtro suicidio
  const isSuicidalMove = (board: Board, move: Move): boolean => {
    const { x, y, color } = move;
    const simulated = board.map((row) => [...row]);
    simulated[y][x] = color;
    const afterCapture = removeCapturedStones(simulated, move);
    const group = getGroup(afterCapture, x, y);
    return !hasLiberties(afterCapture, group);
  };

  // Jugada que captura
  const getSmartMove = useCallback(
    (stones: Move[]): Move | null => {
      const available = shuffle(getAvailableMoves(stones));
      const board = buildBoardFromMoves(stones, boardSize);

      let bestMove: Move | null = null;
      let maxCaptures = -1;

      for (const { x, y } of available) {
        const move: Move = { x, y, color: "white" };
        if (isSuicidalMove(board, move)) continue;

        const testBoard = buildBoardFromMoves(stones, boardSize);
        testBoard[y][x] = "white";

        const resultBoard = removeCapturedStones(testBoard, move);
        const before = countColor(board, "black");
        const after = countColor(resultBoard, "black");
        const captures = before - after;

        if (captures > maxCaptures) {
          maxCaptures = captures;
          bestMove = move;
        }
      }

      return bestMove;
    },
    [getAvailableMoves, boardSize]
  );

  // Jugada que expande territorio
  const getTerritorialMove = useCallback(
    (stones: Move[]): Move | null => {
      const available = shuffle(getAvailableMoves(stones));
      if (available.length === 0) return null;

      const whiteStones = stones.filter((s) => s.color === "white");
      const board = buildBoardFromMoves(stones, boardSize);

      let bestMove: Move | null = null;
      let bestScore = -Infinity;

      for (const { x, y } of available) {
        const move: Move = { x, y, color: "white" };
        if (isSuicidalMove(board, move)) continue;

        let score = 0;

        for (const s of whiteStones) {
          const dx = Math.abs(s.x - x);
          const dy = Math.abs(s.y - y);
          const distance = dx + dy;
          if (distance === 1) score += 3;
          else if (distance === 2) score += 1;
        }

        const isCorner =
          (x === 0 || x === boardSize - 1) &&
          (y === 0 || y === boardSize - 1);
        const isEdge =
          x === 0 || x === boardSize - 1 || y === 0 || y === boardSize - 1;

        if (isCorner) score += 2;
        else if (isEdge) score += 1;

        if (score > bestScore) {
          bestScore = score;
          bestMove = move;
        }
      }

      return bestMove;
    },
    [getAvailableMoves, boardSize]
  );

  // Jugada ideal: captura > expansión > aleatorio
  const getBestBotMove = useCallback(
    (stones: Move[]): Move | null => {
      const smart = getSmartMove(stones);
      if (smart) return smart;

      const territorial = getTerritorialMove(stones);
      if (territorial) return territorial;

      const fallback = getRandomMove(stones);
      return fallback ? { ...fallback, color: "white" } : null;
    },
    [getSmartMove, getTerritorialMove, getRandomMove]
  );

  return {
    getAvailableMoves,
    getRandomMove,
    getSmartMove,
    getTerritorialMove,
    getBestBotMove,
  };
}

// Cuenta piedras de un color
function countColor(board: Board, color: "black" | "white"): number {
  let count = 0;
  for (const row of board) {
    for (const cell of row) {
      if (cell === color) count++;
    }
  }
  return count;
}
