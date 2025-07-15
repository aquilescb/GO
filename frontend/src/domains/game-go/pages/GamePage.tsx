import { useState, useMemo } from "react";
import Board from "@/domains/game-go/components/Board";
import AssistantPanel from "@/domains/game-go/components/AssistantPanel";
import type { Move } from "@/domains/game-go/types/game";

const GamePage = () => {
  const [stones, setStones] = useState<Move[]>([]);
  const [lastPlayerMove, setLastPlayerMove] = useState<Move | null>(null);

  // Calculamos las últimas 3 jugadas negras como contexto para el asistente
  const lastMoves = useMemo(
    () => lastPlayerMove ? [lastPlayerMove] : [],
    [lastPlayerMove]
  );

  return (
    <div className="min-h-screen bg-[#0f1624] text-white p-6 flex justify-center items-center">
      <div className="flex flex-col md:flex-row items-center justify-center gap-10 max-w-7xl w-full">
        {/* Sección del tablero */}
        <div className="flex flex-col items-center">
          <h1 className="text-3xl font-bold text-yellow-400 mb-4">Partida de GO</h1>
          <Board
            onMove={() => {}} 
            onPlayerMove={setLastPlayerMove}
            setStones={setStones}
          />
        </div>
        {/* Panel del asistente */}
        <AssistantPanel lastMoves={lastMoves} stones={stones} />
      </div>
    </div>
  );
};

export default GamePage;
