import { useMemo, useState } from "react";
import type { Move, StoneMap } from "@/lib/types/ui";
import OverlayCandidates from "./OverlayCandidates";
import type { CandidateMove } from "@/lib/types/katago";
import { xyToCoord } from "@/lib/utils/coords";

interface Props {
   moves: Move[];
   onPlay: (coord: string) => void;
   botThinking?: boolean;
   showCoords?: boolean;
   lastBotMove?: string;
   candidates?: CandidateMove[]; // top-3
}

const SIZE = 19;
const LETTERS = "ABCDEFGHJKLMNOPQRST";

// padding del viewBox para dibujar las etiquetas dentro del SVG
const VIEWBOX_PAD_X = 6; // a la izquierda
const VIEWBOX_PAD_Y = 6; // arriba

export default function Board({
   moves,
   onPlay,
   botThinking,
   showCoords = true,
   lastBotMove,
   candidates,
}: Props) {
   const [hover, setHover] = useState<{ x: number; y: number } | null>(null);

   const gridSize = 100;
   const cell = gridSize / (SIZE - 1);

   const stonesMap: StoneMap = useMemo(() => {
      const o: StoneMap = {};
      for (const m of moves) o[`${m.x},${m.y}`] = m.color;
      return o;
   }, [moves]);

   const handleClick = (x: number, y: number) => {
      if (botThinking) return;
      if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
      // 👇 NO permitir poner si ya hay piedra (tuya o del bot)
      if (stonesMap[`${x},${y}`]) return;
      onPlay(xyToCoord(x, y));
   };

   return (
      <div className="mx-auto w-full aspect-square select-none max-w-[min(calc(100dvh-64px),calc(100vw-16px))]">
         <svg
            viewBox={`-${VIEWBOX_PAD_X} -${VIEWBOX_PAD_Y} ${
               gridSize + VIEWBOX_PAD_X * 2
            } ${gridSize + VIEWBOX_PAD_Y * 2}`}
            className="w-full h-full rounded shadow-xl"
            role="img"
            aria-label="Tablero de Go 19x19"
            style={{
               background: "#DDB77B",
               border: "10px solid #6E411F",
               borderRadius: 12,
            }}
         >
            {/* Grid */}
            {[...Array(SIZE)].map((_, i) => {
               const p = i * cell;
               return (
                  <g key={`line-${i}`}>
                     <line
                        x1={0}
                        y1={p}
                        x2={gridSize}
                        y2={p}
                        stroke="#333"
                        strokeWidth={0.22}
                     />
                     <line
                        x1={p}
                        y1={0}
                        x2={p}
                        y2={gridSize}
                        stroke="#333"
                        strokeWidth={0.22}
                     />
                  </g>
               );
            })}

            {/* Etiquetas KGS */}
            {showCoords && (
               <>
                  {[...Array(SIZE)].map((_, i) => (
                     <text
                        key={`letter-${i}`}
                        x={i * cell}
                        y={-2.2}
                        textAnchor="middle"
                        fontSize={2}
                        fill="#333"
                     >
                        {LETTERS[i]}
                     </text>
                  ))}
                  {[...Array(SIZE)].map((_, i) => (
                     <text
                        key={`number-${i}`}
                        x={-3}
                        y={i * cell + 0.8}
                        fontSize={2}
                        fill="#333"
                        textAnchor="middle"
                        alignmentBaseline="middle"
                     >
                        {19 - i}
                     </text>
                  ))}
               </>
            )}

            {/* Hover guide */}
            {hover && !botThinking && !stonesMap[`${hover.x},${hover.y}`] && (
               <circle
                  cx={hover.x * cell}
                  cy={hover.y * cell}
                  r={cell * 0.32}
                  fill="none"
                  stroke="#000"
                  strokeOpacity={0.35}
                  strokeWidth={0.4}
               />
            )}

            {/* Stones */}
            {[...Array(SIZE)].flatMap((_, y) =>
               [...Array(SIZE)].map((_, x) => {
                  const stone = stonesMap[`${x},${y}`];
                  const cx = x * cell,
                     cy = y * cell;
                  const isLastBot = lastBotMove
                     ? xyToCoord(x, y) === lastBotMove
                     : false;

                  return (
                     <g
                        key={`${x}-${y}`}
                        onClick={() => handleClick(x, y)}
                        onMouseEnter={() => setHover({ x, y })}
                        onMouseLeave={() => setHover(null)}
                        className={
                           botThinking ? "cursor-not-allowed" : "cursor-pointer"
                        }
                     >
                        <circle
                           cx={cx}
                           cy={cy}
                           r={cell * 0.45}
                           fill="transparent"
                        />
                        {stone && (
                           <g>
                              <circle
                                 cx={cx}
                                 cy={cy}
                                 r={cell * 0.34}
                                 fill={
                                    stone === "black" ? "#171717" : "#F8FAFC"
                                 }
                                 stroke={stone === "white" ? "#0f172a" : "none"}
                                 strokeWidth={stone === "white" ? 0.25 : 0}
                              />
                              {isLastBot && (
                                 <circle
                                    cx={cx}
                                    cy={cy}
                                    r={cell * 0.42}
                                    fill="none"
                                    stroke="#f59e0b"
                                    strokeWidth={0.5}
                                 />
                              )}
                           </g>
                        )}
                     </g>
                  );
               })
            )}

            {/* Candidatas (top-3) */}
            {candidates && (
               <OverlayCandidates candidates={candidates} cell={cell} />
            )}
         </svg>
      </div>
   );
}
