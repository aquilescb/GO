import { useMemo, useState } from "react";
import type { Move, StoneMap } from "@/lib/types/ui";
import { xyToCoord } from "@/lib/utils/coords";

interface Props {
   moves: Move[];
   onPlay: (coord: string) => void;
   botThinking?: boolean;
   showCoords?: boolean;
   lastBotMove?: string;
}

const SIZE = 19;
const LETTERS = "ABCDEFGHJKLMNOPQRST";

const VIEWBOX_PAD_X = 6;
const VIEWBOX_PAD_Y = 6;

type Color = "black" | "white";
type Key = string;

function key(x: number, y: number): Key {
   return `${x},${y}`;
}

function inBoard(x: number, y: number) {
   return x >= 0 && y >= 0 && x < SIZE && y < SIZE;
}

function neighbors(x: number, y: number) {
   const ns = [
      [x - 1, y],
      [x + 1, y],
      [x, y - 1],
      [x, y + 1],
   ] as const;
   return ns.filter(([nx, ny]) => inBoard(nx, ny));
}

/** BFS: devuelve el grupo conectado (misma color) y su cantidad de libertades */
function collectGroup(
   startX: number,
   startY: number,
   color: Color,
   board: StoneMap
) {
   const stones: Array<[number, number]> = [];
   const seen = new Set<Key>();
   const q: Array<[number, number]> = [[startX, startY]];
   let liberties = 0;

   while (q.length) {
      const [x, y] = q.pop()!;
      const k = key(x, y);
      if (seen.has(k)) continue;
      seen.add(k);
      stones.push([x, y]);

      for (const [nx, ny] of neighbors(x, y)) {
         const nk = key(nx, ny);
         const c = board[nk];
         if (!c) {
            liberties++;
         } else if (c === color && !seen.has(nk)) {
            q.push([nx, ny]);
         }
      }
   }

   return { stones, liberties };
}

/** Aplica capturas sobre una copia de `board` tras colocar una piedra en (x,y) */
function applyMoveWithCaptures(
   board: StoneMap,
   x: number,
   y: number,
   color: Color
) {
   const me = color;
   const opp: Color = color === "black" ? "white" : "black";
   const K = key(x, y);

   // colocar piedra (asumimos jugada legal)
   board[K] = me;

   // capturar grupos rivales sin libertades
   const toCheckOpp = neighbors(x, y)
      .map(([nx, ny]) => [nx, ny, board[key(nx, ny)]] as const)
      .filter(([, , c]) => c === opp);

   for (const [nx, ny] of toCheckOpp.map(
      ([a, b]) => [a, b] as [number, number]
   )) {
      const { stones, liberties } = collectGroup(nx, ny, opp, board);
      if (liberties === 0) {
         for (const [gx, gy] of stones) delete board[key(gx, gy)];
      }
   }

   // si (por rareza) quedara suicida, lo quitamos (KataGo no debería permitirlo)
   const { liberties: myLibs } = collectGroup(x, y, me, board);
   if (myLibs === 0) delete board[K];
}

/** Simula todas las jugadas del historial aplicando capturas */
function buildBoardFromMoves(moves: Move[]): StoneMap {
   const board: StoneMap = {};
   for (const m of moves) {
      if (!inBoard(m.x, m.y)) continue; // ignora PASS u out-of-bounds si apareciera
      if (board[key(m.x, m.y)]) continue; // ya ocupado (defensivo)
      applyMoveWithCaptures(board, m.x, m.y, m.color as Color);
   }
   return board;
}

export default function Board({
   moves,
   onPlay,
   botThinking,
   showCoords = true,
   lastBotMove,
}: Props) {
   const [hover, setHover] = useState<{ x: number; y: number } | null>(null);

   const gridSize = 100;
   const cell = gridSize / (SIZE - 1);

   // ⬇️ AQUÍ el cambio clave: simulamos capturas
   const stonesMap: StoneMap = useMemo(() => {
      return buildBoardFromMoves(moves);
   }, [moves]);

   const handleClick = (x: number, y: number) => {
      if (botThinking) return;
      if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return;
      if (stonesMap[key(x, y)]) return; // casilla ocupada
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
            {hover && !botThinking && !stonesMap[key(hover.x, hover.y)] && (
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
                  const stone = stonesMap[key(x, y)];
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
         </svg>
      </div>
   );
}
