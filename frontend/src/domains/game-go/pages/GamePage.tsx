import { useState, useMemo } from "react";
import Board from "@/domains/game-go/components/Board";
import AssistantPanel from "@/domains/game-go/components/AssistantPanel";
import type { Move } from "@/domains/game-go/types/game";
import { countStones } from "@/domains/game-go/lib/gameLogic";

const GamePage = () => {
  const [stones, setStones] = useState<Move[]>([]);
  const [lastPlayerMove, setLastPlayerMove] = useState<Move | null>(null);
  //Pasar el turno
  const [passes, setPasses] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [result, setResult] = useState<{ black: number; white: number } | null>(null);
  const [winner, setWinner] = useState<"black" | "white" | "empate" | null>(null);
  // Calculamos las últimas 3 jugadas negras como contexto para el asistente
  const lastMoves = useMemo(
    () => lastPlayerMove ? [lastPlayerMove] : [],
    [lastPlayerMove]
  );
  //Pasar el turno
  const handlePassTurn = () => {
    if (passes === 1) {
      const boardSize = 19;
      const board: ("black" | "white" | null)[][] = Array.from({ length: boardSize }, () =>
        Array.from({ length: boardSize }, () => null)
      );

      // Rellenar el board con las piedras actuales
      for (const move of stones) {
        board[move.y][move.x] = move.color;
      }

      const score = countStones(board);
      setResult(score);

      if (score.black > score.white) setWinner("black");
      else if (score.white > score.black) setWinner("white");
      else setWinner("empate");

      setGameOver(true);
    } else {
      setPasses((prev) => prev + 1);
    }
  };

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
          <button
            onClick={handlePassTurn}
            className="mt-4 bg-yellow-500 text-black px-4 py-2 rounded hover:bg-yellow-600"
          >
            Pasar turno
          </button>

          {gameOver && result && (
            <div className="mt-4 p-4 bg-gray-800 rounded text-white text-center">
              <h2 className="text-2xl font-bold mb-2">Fin del juego</h2>
              <p>⚫ Negro: {result.black} piedras</p>
              <p>⚪ Blanco: {result.white} piedras</p>
              <p className="mt-2 text-lg font-semibold">
                🏁 Ganador: {winner === "empate" ? "Empate" : winner === "black" ? "Negro" : "Blanco"}
              </p>
            </div>
          )}
        </div>
        {/* Panel del asistente */}
        <AssistantPanel lastMoves={lastMoves} stones={stones} />
      </div>
    </div>
  );
};

export default GamePage;
