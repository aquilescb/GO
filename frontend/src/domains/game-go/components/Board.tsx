import { useState } from "react";
import Intersection from "../components/Intersection";
import { useBotPlayer } from "@/domains/game-go/hooks/useBotPlayer";
import type { Move } from "@/domains/game-go/types/game";
import { buildBoardFromMoves, removeCapturedStones } from "@/domains/game-go/lib/gameLogic";
const BOARD_SIZE = 19;

interface BoardProps {
  onMove: (move: Move) => void;
  onPlayerMove: (move: Move) => void;
  setStones: React.Dispatch<React.SetStateAction<Move[]>>;
}

const Board = ({ onMove, onPlayerMove, setStones }: BoardProps) => {
    const [stones, localSetStones] = useState<Move[]>([]);
    const [currentColor, setCurrentColor] = useState<"black" | "white">("black");

    const { getBestBotMove } = useBotPlayer(BOARD_SIZE);
    
    const handleClick = (x: number, y: number) => {
    if (stones.some((stone) => stone.x === x && stone.y === y)) return;

    const newStone: Move = { x, y, color: currentColor };

    // 1. Construir board 2D
    const currentBoard = buildBoardFromMoves(stones, BOARD_SIZE);

    // 2. Colocar la nueva piedra
    currentBoard[y][x] = currentColor;

    // 3. Aplicar lógica de captura
    const newBoard = removeCapturedStones(currentBoard, newStone);

    // 4. Convertir back a lista de Move[]
    const newStones: Move[] = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        const color = newBoard[i][j];
        if (color !== null) {
          newStones.push({ x: j, y: i, color });
        }
      }
    }

    localSetStones(newStones);
    setStones(newStones);
    onMove(newStone);

    if (currentColor === "black") {
      onPlayerMove(newStone);
    }

    const nextColor = currentColor === "black" ? "white" : "black";
    setCurrentColor(nextColor);

    if (currentColor === "black") {
      setTimeout(() => {
        makeBotMove(newStones);
      }, 500);
    }
};

  const makeBotMove = (currentStones: Move[]) => {
    const move = getBestBotMove(currentStones);
    if (!move) return;

    const currentBoard = buildBoardFromMoves(currentStones, BOARD_SIZE);

    // 1. Colocar la jugada del bot
    currentBoard[move.y][move.x] = "white";

    // 2. Aplicar captura
    const newBoard = removeCapturedStones(currentBoard, { ...move, color: "white" });

    // 3. Volver a convertir en Move[]
    const newStones: Move[] = [];
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        const color = newBoard[i][j];
        if (color !== null) {
          newStones.push({ x: j, y: i, color });
        }
      }
    }

    localSetStones(newStones);
    setStones(newStones);
    onMove({ ...move, color: "white" });
    setCurrentColor("black");
  };
  return (
  <div className="bg-[#8b5e3c] p-4 rounded-lg shadow-inner">
    <div
      className="grid gap-0"
      style={{
        gridTemplateColumns: `repeat(${BOARD_SIZE}, 32px)`,
        gridTemplateRows: `repeat(${BOARD_SIZE}, 32px)`
      }}
    >
      {Array.from({ length: BOARD_SIZE * BOARD_SIZE }).map((_, index) => {
        const x = index % BOARD_SIZE;
        const y = Math.floor(index / BOARD_SIZE);
        const stone = stones.find((s) => s.x === x && s.y === y);

        return (
          <Intersection
            key={`${x}-${y}`}
            x={x}
            y={y}
            stoneColor={stone?.color}
            onClick={() => handleClick(x, y)}
          />
        );
      })}
    </div>
  </div>
  );
};

export default Board;
