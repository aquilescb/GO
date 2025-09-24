import { useEffect, useMemo, useRef, useState } from "react";
import Board from "@/domains/game-go/components/Board";
import OwnershipMap from "@/domains/game-go/components/OverlayOwnership";
import type { Move, StoneMap } from "@/lib/types/ui";
import type { CandidateMove, PlayResponse } from "@/lib/types/katago";
import { coordToXY } from "@/lib/utils/coords";
import { playMove, shutdownEngine } from "@/lib/api/katagoApi";
import { useNavigate } from "react-router-dom";
import PracticeBoard from "@/domains/game-go/components/PracticeBoard";
import { formatPercent2, formatFixed3 } from "@/lib/utils/coords";

export default function GamePage() {
   const navigate = useNavigate();

   const [moves, setMoves] = useState<Move[]>([]);
   const [botThinking, setBotThinking] = useState(false);
   const [lastBotMove, setLastBotMove] = useState<string | undefined>(
      undefined
   );
   const [ownership, setOwnership] = useState<number[] | undefined>(undefined);
   const [candidates, setCandidates] = useState<CandidateMove[] | undefined>(
      undefined
   );
   const [analysis, setAnalysis] = useState<{
      scoreMean: number;
      winrate: number;
   } | null>(null);
   const [error, setError] = useState<string | null>(null);
   const [moveHistory, setMoveHistory] = useState<
      { move: string; by: "player" | "bot" }[]
   >([]);

   const rightPanelRef = useRef<HTMLDivElement | null>(null);

   const stones: StoneMap = useMemo(() => {
      const o: StoneMap = {};
      for (const m of moves) o[`${m.x},${m.y}`] = m.color;
      return o;
   }, [moves]);

   useEffect(() => {
      const el = rightPanelRef.current;
      if (!el) return;
      el.scrollTop = el.scrollHeight;
   }, [moveHistory]);

   const handlePlay = async (coord: string) => {
      if (botThinking) return;
      setBotThinking(true);
      setError(null);

      const playerMove: Move = { ...coordToXY(coord), color: "black" };
      setMoves((prev) => [...prev, playerMove]);
      setMoveHistory((p) => [...p, { move: coord, by: "player" }]);

      try {
         const res: PlayResponse = await playMove(coord);
         const botMove = res.botMove;
         setLastBotMove(botMove);
         const botMoveXY: Move = { ...coordToXY(botMove), color: "white" };
         setMoves((prev) => [...prev, botMoveXY]);
         setMoveHistory((p) => [...p, { move: botMove, by: "bot" }]);

         setOwnership(res.analysis.ownership);
         setCandidates(res.analysis.candidates);
         setAnalysis({
            scoreMean: res.analysis.scoreMean,
            winrate: res.analysis.winrate,
         });
      } catch (e: any) {
         setMoves((prev) => prev.slice(0, -1));
         setMoveHistory((p) => p.slice(0, -1));
         setError(e?.message || "Error jugando la jugada");
      } finally {
         setBotThinking(false);
      }
   };

   const handlePass = async () => {
      await handlePlay("PASS");
   };

   return (
      <div className="min-h-screen w-full bg-[#0f2433] text-white">
         <header className="sticky top-0 z-20 border-b border-[#2a3b48] bg-[#0f2433cc] backdrop-blur px-2">
            <div className="max-w-[1500px] mx-auto h-14 flex items-center justify-between gap-3">
               <h1 className="text-lg sm:text-xl font-semibold">
                  KataGo — Game
               </h1>
               <button
                  onClick={async () => {
                     try {
                        await shutdownEngine();
                     } catch {}
                     navigate("/");
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-3 py-1.5 rounded-lg"
               >
                  Volver
               </button>
            </div>
         </header>

         <main className="max-w-[1500px] mx-auto px-2 py-2 grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_300px] gap-3">
            {/* Izquierda: Ownership */}
            <aside className="space-y-3 lg:sticky lg:top-[64px] lg:self-start">
               <div className="rounded-xl border border-[#2a3b48] bg-[#1b2a39] p-4">
                  <h3 className="font-semibold mb-2 text-[#f0c23b]">
                     Ownership
                  </h3>
                  <OwnershipMap ownership={ownership} size={280} />
               </div>
            </aside>

            {/* Centro: Tablero principal + panel inferior */}
            <section className="flex flex-col items-center gap-4">
               <Board
                  moves={moves}
                  onPlay={handlePlay}
                  botThinking={botThinking}
                  lastBotMove={lastBotMove}
                  candidates={candidates}
               />

               {/* Panel inferior */}
               <div className="w-full space-y-3">
                  {/* Score & Winrate sin redondeo (trunc) */}
                  {analysis && (
                     <div className="rounded-xl border border-[#2a3b48] bg-[#1b2a39] p-3 flex gap-4 justify-center text-sm">
                        <span>
                           <b>Winrate:</b> {formatPercent2(analysis.winrate)}%
                        </span>
                        <span>
                           <b>ScoreMean:</b> {formatFixed3(analysis.scoreMean)}
                        </span>
                     </div>
                  )}

                  {/* Candidatas */}
                  {candidates && candidates.length > 0 && (
                     <div className="rounded-xl border border-[#2a3b48] bg-[#1b2a39] p-3">
                        <h4 className="font-medium mb-2">Candidatas (top-3)</h4>
                        <ul className="text-sm space-y-1">
                           {candidates.map((c) => (
                              <li key={c.order}>
                                 #{c.order} {c.move} · Prior:{" "}
                                 {formatPercent2(c.prior)}% · Winrate{" "}
                                 {formatPercent2(c.winrate)}% · Puntos:{" "}
                                 {formatFixed3(c.scoreMean)}
                              </li>
                           ))}
                        </ul>
                     </div>
                  )}

                  {error && <p className="text-sm text-red-400">{error}</p>}

                  {/* Movimientos */}
                  <div className="rounded-xl border border-[#2a3b48] bg-[#1b2a39] p-4">
                     <div className="flex items-center justify-between mb-2">
                        <h3 className="text-[#f0c23b] font-semibold">
                           Movimientos
                        </h3>
                        <button
                           onClick={handlePass}
                           disabled={botThinking}
                           className="bg-[#2a3b48] hover:bg-[#34485a] text-white text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-60"
                        >
                           PASS
                        </button>
                     </div>
                     <div
                        ref={rightPanelRef}
                        className="max-h-[200px] overflow-y-auto pr-1 rounded-md border border-[#2a3b48] bg-[#203142]"
                     >
                        <ol className="text-sm divide-y divide-[#2a3b48]">
                           {moveHistory.map((m, i) => (
                              <li
                                 key={i}
                                 className="flex items-center justify-between px-3 py-2"
                              >
                                 <span className="text-gray-300">#{i + 1}</span>
                                 <span
                                    className={
                                       m.by === "player"
                                          ? "text-blue-300"
                                          : "text-red-300"
                                    }
                                 >
                                    {m.by === "player" ? "🧑" : "🤖"}{" "}
                                    {m.move.toUpperCase()}
                                 </span>
                              </li>
                           ))}
                        </ol>
                     </div>
                  </div>
               </div>
            </section>

            {/* Derecha: tablero libre ligado a la partida */}
            <aside className="space-y-3 lg:sticky lg:top-[64px] lg:self-start">
               <div className="rounded-xl border border-[#2a3b48] bg-[#1b2a39] p-4">
                  <h3 className="font-semibold mb-2 text-[#f0c23b]">
                     Tablero libre
                  </h3>
                  {/* Inicia con las piedras actuales; por defecto explora con blancas primero */}
                  <PracticeBoard baseMoves={moves} startColor="white" />
               </div>
            </aside>
         </main>
      </div>
   );
}
