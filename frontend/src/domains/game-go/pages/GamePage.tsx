// src/domains/game-go/pages/GamePage.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Board from "@/domains/game-go/components/Board";
import OverlayOwnership from "@/domains/game-go/components/OverlayOwnership";
import MoveStrip from "@/domains/game-go/components/MoveStrip";
import PracticeBoard from "@/domains/game-go/components/PracticeBoard";
import { playEval, shutdownEngine, startGame } from "@/lib/api/katagoApi";
import { coordToXY, formatFixed3 } from "@/lib/utils/coords";
import CommentBox from "../components/CommentBox";
import type { Move } from "@/lib/types/ui";
import type { PlayEvalV2Response } from "@/lib/types/katago";

export default function GamePage() {
   const navigate = useNavigate();

   const [moves, setMoves] = useState<Move[]>([]);
   const [botThinking, setBotThinking] = useState(false);
   const [lastBotMove, setLastBotMove] = useState<string>();

   const [metrics, setMetrics] = useState<PlayEvalV2Response["metrics"]>();
   const [movBot, setMovBot] = useState<PlayEvalV2Response["MovBot"]>();
   const [movUser, setMovUser] = useState<PlayEvalV2Response["MovUser"]>();
   const [, setStateMoves] = useState<string[]>([]);
   const [ownership, setOwnership] = useState<number[] | undefined>(undefined);
   const [comments, setComments] = useState<Record<number, string>>({});

   const [error, setError] = useState<string>();

   const [history, setHistory] = useState<
      { move: string; by: "player" | "bot" }[]
   >([]);
   const rightRef = useRef<HTMLDivElement>(null);

   const currentIdx = history.length - 1;
   const currentComment = comments[currentIdx] ?? "";
   const setCurrentComment = (comment: string) =>
      setComments((c) => ({ ...c, [currentIdx]: comment }));

   useEffect(() => {
      if (rightRef.current)
         rightRef.current.scrollTop = rightRef.current.scrollHeight;
   }, [history]);

   const [engineReady, setEngineReady] = useState(false);

   useEffect(() => {
      (async () => {
         try {
            await startGame();
            setMoves([]);
            setMetrics(undefined);
            setMovBot(undefined);
            setMovUser(undefined);
            setStateMoves([]);
            setOwnership(undefined);
            setHistory([]);
            setError(undefined);
            setLastBotMove(undefined);
            setComments({});
            setEngineReady(true);
         } catch (e: any) {
            setError(
               `No pude iniciar el engine: ${e?.message ?? "desconocido"}`
            );
            setEngineReady(false);
         }
      })();
   }, []);

   async function handlePlay(coord: string) {
      if (!engineReady || botThinking) return;
      setBotThinking(true);
      setError(undefined);

      const playerMove: Move = { ...coordToXY(coord), color: "black" };
      setMoves((m) => [...m, playerMove]);
      setHistory((h) => [...h, { move: coord, by: "player" }]);

      try {
         const res = await playEval(coord);

         const botMove = res.MovBot.botMove;
         setLastBotMove(botMove);
         const botMoveXY: Move = { ...coordToXY(botMove), color: "white" };
         setMoves((m) => [...m, botMoveXY]);
         setHistory((h) => [...h, { move: botMove, by: "bot" }]);

         setMetrics(res.metrics);
         setMovBot(res.MovBot);
         setMovUser(res.MovUser);
         setStateMoves(res.state.moves);
         setOwnership(res.ownership);
      } catch (e: any) {
         setMoves((m) => m.slice(0, -1));
         setHistory((h) => h.slice(0, -1));
         setError(`Error al jugar: ${e?.message ?? "desconocido"}`);
         console.error("play-eval error:", e);
      } finally {
         setBotThinking(false);
      }
   }
   const handlePass = async () => {
      if (!engineReady || botThinking) return;
      setBotThinking(true);
      try {
         const res = await playEval("PASS");
         // actualizar métricas/ownership/lastBotMove igual que con jugada normal
         if (res.MovBot?.botMove) {
            const botMoveXY = {
               ...coordToXY(res.MovBot.botMove),
               color: "white" as const,
            };
            setMoves((m) => [...m, botMoveXY]);
         }
         setMetrics(res.metrics);
         setMovBot(res.MovBot);
         setMovUser(res.MovUser);
         setOwnership(res.ownership);
      } catch (e: any) {
         setError(`Error al pasar: ${e?.message ?? "desconocido"}`);
      } finally {
         setBotThinking(false);
      }
   };

   return (
      <div className="min-h-screen w-full bg-[#0f2433] text-white">
         <header className="sticky top-0 z-20 border-b border-[#2a3b48] bg-[#0f2433cc] backdrop-blur px-3">
            <div className="max-w-[1500px] mx-auto h-14 flex items-center justify-between">
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

         <main className="max-w-[1500px] mx-auto px-3 py-3 grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)_340px] gap-3">
            {/* IZQUIERDA */}
            <aside className="space-y-3 lg:sticky lg:top-[64px] lg:self-start">
               <div className="rounded-xl border border-[#2a3b48] bg-[#1b2a39] p-4">
                  <h3 className="font-semibold mb-2 text-[#f0c23b] text-center">
                     Mapa de Influencia
                  </h3>
                  <OverlayOwnership ownership={ownership} size={280} />
               </div>
               <div className="rounded-xl border border-[#2a3b48] bg-[#1b2a39] p-4">
                  <CommentBox
                     value={currentComment}
                     onChange={setCurrentComment}
                  />
               </div>
            </aside>

            {/* CENTRO */}
            <section className="flex flex-col items-center gap-4">
               <Board
                  moves={moves}
                  onPlay={engineReady && !botThinking ? handlePlay : () => {}}
                  botThinking={botThinking}
                  lastBotMove={lastBotMove}
               />

               <div className="w-full space-y-3">
                  {/* Delta Winrate */}

                  {metrics && (
                     <div className="rounded-xl border border-[#2a3b48] bg-[#1b2a39] p-4">
                        <h4 className="font-semibold mb-3 text-[#f0c23b] text-center">
                           Análisis de tu Jugada
                        </h4>

                        <div className="grid sm:grid-cols-2 gap-3">
                           {/* Delta Puntos (abs en grande + leyenda por signo) */}
                           <MetricBlock
                              title="Delta Puntos"
                              value={formatFixed3(Math.abs(metrics.lossPoints))}
                              ok={metrics.lossPoints <= 0.5} // umbral leve
                              desc={
                                 <>
                                    <RowKV
                                       k="Mejor / Tu jugada"
                                       v={`${formatFixed3(
                                          metrics.bestScorePre
                                       )} / ${formatFixed3(
                                          metrics.scoreAfterUser
                                       )}`}
                                    />
                                    {metrics.lossPoints > 0 ? (
                                       <div className="mt-2 text-red-300">
                                          Perdiste{" "}
                                          {formatFixed3(metrics.lossPoints)} pts
                                       </div>
                                    ) : metrics.lossPoints < 0 ? (
                                       <div className="mt-2 text-green-300">
                                          Ganaste{" "}
                                          {formatFixed3(-metrics.lossPoints)}{" "}
                                          pts
                                       </div>
                                    ) : (
                                       <div className="mt-2 opacity-70">
                                          Sin diferencia
                                       </div>
                                    )}
                                 </>
                              }
                           />

                           {/* Delta Winrate (abs en grande + leyenda por signo) */}
                           <MetricBlock
                              title="Delta Winrate"
                              value={
                                 (Math.abs(metrics.lossWinrate) * 100).toFixed(
                                    2
                                 ) + "%"
                              }
                              ok={metrics.lossWinrate <= 0}
                              desc={
                                 <>
                                    <RowKV
                                       k="Mejor / Tu jugada"
                                       v={`${(metrics.bestWRPre * 100).toFixed(
                                          2
                                       )}% / ${(
                                          metrics.wrAfterUser * 100
                                       ).toFixed(2)}%`}
                                    />
                                    {metrics.lossWinrate > 0 ? (
                                       <div className="mt-2 text-red-300">
                                          Perdiste{" "}
                                          {(metrics.lossWinrate * 100).toFixed(
                                             2
                                          )}
                                          %
                                       </div>
                                    ) : metrics.lossWinrate < 0 ? (
                                       <div className="mt-2 text-green-300">
                                          Ganaste{" "}
                                          {(-metrics.lossWinrate * 100).toFixed(
                                             2
                                          )}
                                          %
                                       </div>
                                    ) : (
                                       <div className="mt-2 opacity-70">
                                          Sin diferencia
                                       </div>
                                    )}
                                 </>
                              }
                           />
                        </div>
                     </div>
                  )}
                  {/* BOT */}
                  {movBot && (
                     <Block title="Datos del Movimiento del KataGo (Bot)">
                        <MiniGrid
                           list={[
                              ["Bot Best Move", movBot.botMove ?? "—"],
                              [
                                 "Winrate",
                                 movBot.candidates?.[0]
                                    ? `${(
                                         movBot.candidates[0].winrateBlack * 100
                                      ).toFixed(2)}%`
                                    : "—",
                              ],
                              [
                                 "Score",
                                 movBot.candidates?.[0]
                                    ? formatFixed3(
                                         movBot.candidates[0].scoreMeanBlack
                                      )
                                    : "—",
                              ],
                           ]}
                        />
                        <PV
                           label="PV (Best)"
                           pv={movBot.candidates?.[0]?.pv ?? []}
                        />
                        <CandidatesTable
                           rows={movBot.candidates ?? []}
                           title="Candidatas del Bot (top-3)"
                        />
                     </Block>
                  )}

                  {movUser && (
                     <Block title="Consejos para el Usuario (próximo turno)">
                        <MiniGrid
                           list={[
                              [
                                 "Mejor sugerida",
                                 movUser.recommendations?.[0]?.move ?? "—",
                              ],
                              [
                                 "Winrate",
                                 movUser.recommendations?.[0]
                                    ? `${(
                                         movUser.recommendations[0]
                                            .winrateBlack * 100
                                      ).toFixed(2)}%`
                                    : "—",
                              ],
                              [
                                 "Score",
                                 movUser.recommendations?.[0]
                                    ? formatFixed3(
                                         movUser.recommendations[0]
                                            .scoreMeanBlack
                                      )
                                    : "—",
                              ],
                           ]}
                        />
                        <PV
                           label="PV (del best usuario)"
                           pv={movUser.recommendations?.[0]?.pv ?? []}
                        />
                        <CandidatesTable
                           rows={movUser.recommendations ?? []}
                           title="Recomendaciones para el Usuario (top-3)"
                        />
                     </Block>
                  )}

                  {error && <p className="text-sm text-red-400">{error}</p>}
               </div>
            </section>

            {/* DERECHA */}
            <aside
               className="space-y-3 lg:sticky lg:top-[64px] lg:self-start"
               ref={rightRef}
            >
               <MoveStrip history={history} />
               <div className="rounded-xl border border-[#2a3b48] bg-[#1b2a39] p-4">
                  <h3 className="font-semibold mb-2 text-[#f0c23b]">
                     Tablero libre
                  </h3>
                  <div className="mb-2">
                     <button
                        onClick={handlePass}
                        disabled={botThinking}
                        className="bg-[#2a3b48] hover:bg-[#34485a] text-white text-xs font-medium px-3 py-1.5 rounded-lg disabled:opacity-60"
                     >
                        PASS
                     </button>
                  </div>
                  <PracticeBoard baseMoves={moves} startColor="white" />
               </div>
            </aside>
         </main>
      </div>
   );
}

/* ========= UI helpers ========= */

function MetricBlock({
   title,
   value,
   ok,
   desc,
}: {
   title: string;
   value: string;
   ok?: boolean;
   desc: React.ReactNode; // 👈 antes era string
}) {
   return (
      <div className="rounded-md bg-[#203142] p-2">
         <div className="opacity-80">{title}</div>
         <div className={`text-lg ${ok ? "text-green-300" : "text-red-300"}`}>
            {value}
         </div>
         <div className="text-xs opacity-90 mt-1">{desc}</div>
      </div>
   );
}
function Block({
   title,
   children,
}: {
   title: string;
   children: React.ReactNode;
}) {
   return (
      <div className="rounded-xl border border-[#2a3b48] bg-[#1b2a39] p-4">
         <h4 className="font-semibold mb-3 text-[#f0c23b]">{title}</h4>
         {children}
      </div>
   );
}
function MiniGrid({ list }: { list: [string, string][] }) {
   return (
      <div className="grid sm:grid-cols-3 gap-3 text-sm mb-3">
         {list.map(([label, val]) => (
            <div key={label} className="rounded-md bg-[#203142] p-2">
               <div className="opacity-80">{label}</div>
               <div className="text-lg">{val}</div>
            </div>
         ))}
      </div>
   );
}
function PV({ label, pv }: { label: string; pv: string[] }) {
   return (
      <div className="rounded-md bg-[#203142] p-2 mb-3">
         <div className="opacity-80 mb-1">{label}</div>
         <div className="text-sm">{pv.join(" → ") || "—"}</div>
      </div>
   );
}
function CandidatesTable({
   rows,
   title,
}: {
   rows: {
      move: string;
      prior: number;
      winrateBlack: number;
      scoreMeanBlack: number;
      pv: string[];
   }[];
   title: string;
}) {
   return (
      <div className="rounded-md bg-[#203142] p-2">
         <div className="opacity-80 mb-2 text-sm">{title}</div>
         <div className="overflow-x-auto">
            <table className="w-full text-xs">
               <thead className="text-left opacity-80">
                  <tr>
                     <th className="py-1 pr-2">#</th>
                     <th className="py-1 pr-2">Move</th>
                     <th className="py-1 pr-2">Prior</th>
                     <th className="py-1 pr-2">WR</th>
                     <th className="py-1 pr-2">Score</th>
                     <th className="py-1 pr-2">PV</th>
                  </tr>
               </thead>
               <tbody>
                  {rows.map((r, i) => (
                     <tr
                        key={`${r.move}-${i}`}
                        className="border-t border-[#2a3b48]"
                     >
                        <td className="py-1 pr-2">{i + 1}</td>
                        <td className="py-1 pr-2 font-semibold">{r.move}</td>
                        <td className="py-1 pr-2">{formatFixed3(r.prior)}</td>
                        <td className="py-1 pr-2">
                           {(r.winrateBlack * 100).toFixed(2)}%
                        </td>
                        <td className="py-1 pr-2">
                           {formatFixed3(r.scoreMeanBlack)}
                        </td>
                        <td className="py-1 pr-2">{r.pv.join(" → ")}</td>
                     </tr>
                  ))}
               </tbody>
            </table>
         </div>
      </div>
   );
}
function RowKV({ k, v }: { k: string; v: string }) {
   return (
      <div className="flex items-center justify-between text-xs opacity-80">
         <span>{k}</span>
         <span className="font-semibold opacity-100">{v}</span>
      </div>
   );
}
