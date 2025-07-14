import { useState } from "react";
import Intersection from "./Intersection";
import { useBotPlayer } from "@/hooks/useBotPlayer";
import type { Move } from "@/types/game";

const BOARD_SIZE = 19;

interface BoardProps {
  onMove: (move: Move) => void;
  onPlayerMove: (move: Move) => void;
  setStones: React.Dispatch<React.SetStateAction<Move[]>>;
}

const Board = ({ onMove, onPlayerMove, setStones }: BoardProps) => {
  const [stones, localSetStones] = useState<Move[]>([]);
  const [currentColor, setCurrentColor] = useState<"black" | "white">("black");

  const { getRandomMove } = useBotPlayer(BOARD_SIZE);

  const handleClick = (x: number, y: number) => {
    if (stones.some((stone) => stone.x === x && stone.y === y)) return;

    const newStone: Move = { x, y, color: currentColor };
    const updatedStones = [...stones, newStone];

    localSetStones(updatedStones);
    setStones(updatedStones);

    onMove(newStone);

    if (currentColor === "black") {
      onPlayerMove(newStone); // solo responde si juega el humano
    }

    const nextColor = currentColor === "black" ? "white" : "black";
    setCurrentColor(nextColor);

    if (currentColor === "black") {
      setTimeout(() => {
        makeBotMove(updatedStones);
      }, 500);
    }
  };

  const makeBotMove = (currentStones: Move[]) => {
    const move = getRandomMove(currentStones);
    if (!move) return;

    const botStone: Move = { ...move, color: "white" };
    const updated = [...currentStones, botStone];

    localSetStones(updated);
    setStones(updated);
    onMove(botStone);
    setCurrentColor("black");
  };

  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${BOARD_SIZE}, 32px)`,
        gridTemplateRows: `repeat(${BOARD_SIZE}, 32px)`,
        gap: "0px",
        border: "4px solid #8b5e3c",
        backgroundColor: "#9c6225",
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
  );
};

export default Board;
