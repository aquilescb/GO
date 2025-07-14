import { useState } from "react";
import Board from "@/features/game/Board";
import AssistantPanel from "@/features/assistant/AssistantPanel";
import type { Move } from "@/types/game";

const GamePage = () => {
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [lastPlayerMove, setLastPlayerMove] = useState<Move | null>(null);
  const [stones, setStones] = useState<Move[]>([]);

  return (
    <div className="min-h-screen bg-[#0f1624] text-white flex items-center justify-center p-4">
      <div className="flex gap-6 max-w-7xl w-full justify-center items-start">
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-bold text-yellow-400 mb-4">Partida de GO</h1>
          <Board
            onMove={setLastMove}
            onPlayerMove={setLastPlayerMove}
            setStones={setStones}
          />
        </div>
        <AssistantPanel lastMove={lastPlayerMove} stones={stones} />
      </div>
    </div>
  );
};

export default GamePage;
