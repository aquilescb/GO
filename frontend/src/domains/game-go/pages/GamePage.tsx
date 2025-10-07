// src/domains/game-go/pages/GamePage.tsx
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

import Board from "@/domains/game-go/components/Board";
import OverlayOwnership from "@/domains/game-go/components/OverlayOwnership";
import MoveStrip from "@/domains/game-go/components/MoveStrip";
import PracticeBoard from "@/domains/game-go/components/PracticeBoard";
import TagsSelect from "@/domains/game-go/components/TagsSelect";

import { playEval, shutdownEngine, startGame } from "@/lib/api/katagoApi";
import { coordToXY, formatFixed3 } from "@/lib/utils/coords";

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

   const [error, setError] = useState<string>();
   const [tags, setTags] = useState<string[]>([]);
   const [history, setHistory] = useState<
      { move: string; by: "player" | "bot" }[]
   >([]);
   const rightRef = useRef<HTMLDivElement>(null);

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
         // 👉 si querés verlo en consola sin formato:
         // console.log("METRICS DEBUG:", res.metrics.debug);
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
      await handlePlay("PASS");
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
                  <TagsSelect value={tags} onChange={setTags} />
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
                  {/* METRICS */}
                  {metrics && (
                     <div className="rounded-xl border border-[#2a3b48] bg-[#1b2a39] p-4">
                        <h4 className="font-semibold mb-3 text-[#f0c23b] text-center">
                           Datos del KataGo
                        </h4>
                        <div className="grid sm:grid-cols-2 lg:grid-cols-2 gap-3 text-center">
                           <MetricBlock
                              title="Delta Puntos"
                              value={formatFixed3(metrics.lossPoints)}
                              ok={metrics.lossPoints <= 0.15}
                              desc={`PV ${formatFixed3(
                                 metrics.scoreAfterUser
                              )} · Usuario ${formatFixed3(
                                 metrics.bestScorePre
                              )}`}
                           />
                           <MetricBlock
                              title="Delta Winrate"
                              value={
                                 (metrics.lossWinrate * 100).toFixed(2) + "%"
                              }
                              ok={metrics.lossWinrate <= 0.3}
                              desc={`PV ${(metrics.bestWRPre * 100).toFixed(
                                 2
                              )}% · Usuario ${(
                                 metrics.wrAfterUser * 100
                              ).toFixed(2)}%`}
                           />
                        </div>
                     </div>
                  )}

                  {/* BOT */}
                  {movBot && (
                     <Block title="Datos del Movimiento del KataGo (Bot)">
                        <MiniGrid
                           list={[
                              ["Bot Best Move", movBot.botMove],
                              [
                                 "Winrate",
                                 movBot.candidates[0]
                                    ? `${(
                                         movBot.candidates[0].winrateBlack * 100
                                      ).toFixed(2)}%`
                                    : "—",
                              ],
                              [
                                 "Score",
                                 movBot.candidates[0]
                                    ? formatFixed3(
                                         movBot.candidates[0].scoreMeanBlack
                                      )
                                    : "—",
                              ],
                           ]}
                        />
                        <PV
                           label="PV (Best)"
                           pv={movBot.candidates[0]?.pv ?? []}
                        />
                        <CandidatesTable
                           rows={movBot.candidates}
                           title="Candidatas del Bot (top-3)"
                        />
                     </Block>
                  )}

                  {/* USUARIO */}
                  {movUser && (
                     <Block title="Consejos para el Usuario">
                        <MiniGrid
                           list={[
                              [
                                 "Sugerida",
                                 movUser.recommendations[0]?.move ?? "—",
                              ],
                              [
                                 "Winrate",
                                 movUser.recommendations[0]
                                    ? `${(
                                         movUser.recommendations[0]
                                            .winrateBlack * 100
                                      ).toFixed(2)}%`
                                    : "—",
                              ],
                              [
                                 "Score",
                                 movUser.recommendations[0]
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
                           pv={movUser.recommendations[0]?.pv ?? []}
                        />
                        <CandidatesTable
                           rows={movUser.recommendations}
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
   desc: string;
}) {
   return (
      <div className="rounded-md bg-[#203142] p-2">
         <div className="opacity-80">{title}</div>
         <div className={`text-lg ${ok ? "text-green-300" : "text-red-300"}`}>
            {value}
         </div>
         <div className="text-xs opacity-70">{desc}</div>
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
