import Intersection from "./Intersection";
import { useState } from "react";
import { useBotPlayer } from "@/hooks/useBotPlayer";

const BOARD_SIZE = 19;

const Board = ({
    onMove,
  onPlayerMove,
}: {
  onMove: (move: { x: number; y: number }) => void;
  onPlayerMove: (move: { x: number; y: number }) => void;
}) => {
  const [stones, setStones] = useState<
    { x: number; y: number; color: "black" | "white" }[]
  >([]);
  const [currentColor, setCurrentColor] = useState<"black" | "white">("black");

  const { getRandomMove } = useBotPlayer(BOARD_SIZE);

  const handleClick = (x: number, y: number) => {
    if (stones.some((stone) => stone.x === x && stone.y === y)) return;

    const newStone = { x, y, color: currentColor };
    setStones((prev) => [...prev, newStone]);
    onMove({ x, y });
    onPlayerMove({ x, y }); // solo cuando juega el humano

    const nextColor = currentColor === "black" ? "white" : "black";
    setCurrentColor(nextColor);

    // Turno del bot (blanco)
    if (currentColor === "black") {
      setTimeout(() => {
        makeBotMove(stones.concat(newStone));
      }, 500);
    }
  };

  const makeBotMove = (currentStones: typeof stones) => {
    const move = getRandomMove(currentStones);
    if (!move) return;

    const botStone = { ...move, color: "white" as const };
    setStones([...currentStones, botStone]);
    onMove(move);
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
