import { useEffect, useMemo, useRef, useState } from "react";
import type { Move, StoneMap } from "@/lib/types/ui";
import SketchCanvas from "./SketchCanvas";

const SIZE = 19;
const LETTERS = "ABCDEFGHJKLMNOPQRST";

interface Props {
   baseMoves: Move[];
   startColor?: "black" | "white";
}

export default function PracticeBoard({
   baseMoves,
   startColor = "white",
}: Props) {
   const [hypoMoves, setHypoMoves] = useState<Move[]>([]);
   const [turn, setTurn] = useState<"black" | "white">(startColor);
   const [showSketch, setShowSketch] = useState(false);
   const [sketchVersion, setSketchVersion] = useState(0); // para limpiar el dibujo

   const boardRef = useRef<HTMLDivElement | null>(null);

   useEffect(() => {
      setHypoMoves([]);
      setTurn(startColor);
   }, [baseMoves, startColor]);

   const stonesMap: StoneMap = useMemo(() => {
      const o: StoneMap = {};
      for (const m of baseMoves) o[`${m.x},${m.y}`] = m.color;
      for (const m of hypoMoves) o[`${m.x},${m.y}`] = m.color;
      return o;
   }, [baseMoves, hypoMoves]);

   const gridSize = 100;
   const cell = gridSize / (SIZE - 1);

   const handlePlace = (x: number, y: number) => {
      // Si el lápiz está activo, no colocamos piedras
      if (showSketch) return;
      if (stonesMap[`${x},${y}`]) return;
      const move: Move = { x, y, color: turn };
      setHypoMoves((prev) => [...prev, move]);
      setTurn((t) => (t === "black" ? "white" : "black"));
   };

   const undo = () => {
      setHypoMoves((prev) => prev.slice(0, -1));
      setTurn((t) => (t === "black" ? "white" : "black"));
   };

   const clear = () => {
      setHypoMoves([]);
      setTurn(startColor);
   };

   const clearSketch = () => setSketchVersion((v) => v + 1);
   const swapTurn = () => setTurn((t) => (t === "black" ? "white" : "black"));

   return (
      <div className="space-y-3">
         <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="opacity-80">
               Turno: {turn === "black" ? "Negras" : "Blancas"}
            </span>

            <button
               onClick={swapTurn}
               className="px-2 py-1 rounded bg-[#2a3b48] hover:bg-[#34485a]"
            >
               Cambiar turno
            </button>
            <button
               onClick={undo}
               className="px-2 py-1 rounded bg-[#2a3b48] hover:bg-[#34485a]"
            >
               Deshacer
            </button>
            <button
               onClick={clear}
               className="px-2 py-1 rounded bg-[#2a3b48] hover:bg-[#34485a]"
            >
               Limpiar
            </button>

            <button
               onClick={() => setShowSketch((v) => !v)}
               className="px-2 py-1 rounded bg-[#2a3b48] hover:bg-[#34485a]"
            >
               {showSketch ? "Ocultar lápiz" : "Mostrar lápiz"}
            </button>

            <button
               onClick={clearSketch}
               className="px-2 py-1 rounded bg-[#2a3b48] hover:bg-[#34485a]"
            >
               Limpiar dibujo
            </button>
         </div>

         {/* Contenedor relativo para superponer el lápiz */}
         <div ref={boardRef} className="relative w-full">
            {/* Tablero */}
            <svg
               viewBox={`0 0 ${gridSize} ${gridSize}`}
               className="w-full aspect-square rounded shadow block"
               style={{ background: "#DDB77B", border: "8px solid #6E411F" }}
               aria-label="Tablero de práctica"
            >
               {/* Grid */}
               {[...Array(SIZE)].map((_, i) => {
                  const p = i * cell;
                  return (
                     <g key={i}>
                        <line
                           x1={0}
                           y1={p}
                           x2={gridSize}
                           y2={p}
                           stroke="#333"
                           strokeWidth={0.2}
                        />
                        <line
                           x1={p}
                           y1={0}
                           x2={p}
                           y2={gridSize}
                           stroke="#333"
                           strokeWidth={0.2}
                        />
                     </g>
                  );
               })}

               {/* Etiquetas */}
               {[...Array(SIZE)].map((_, i) => (
                  <text
                     key={`L${i}`}
                     x={i * cell}
                     y={-1}
                     fontSize={2}
                     textAnchor="middle"
                     fill="#263238"
                  >
                     {LETTERS[i]}
                  </text>
               ))}
               {[...Array(SIZE)].map((_, i) => (
                  <text
                     key={`N${i}`}
                     x={-2}
                     y={i * cell + 1}
                     fontSize={2}
                     fill="#263238"
                  >
                     {SIZE - i}
                  </text>
               ))}

               {/* Intersecciones clickeables + piedras */}
               {[...Array(SIZE)].flatMap((_, y) =>
                  [...Array(SIZE)].map((_, x) => {
                     const key = `${x},${y}`;
                     const color = stonesMap[key];
                     const cx = x * cell;
                     const cy = y * cell;

                     return (
                        <g
                           key={key}
                           className={
                              showSketch ? "cursor-crosshair" : "cursor-pointer"
                           }
                        >
                           <circle
                              cx={cx}
                              cy={cy}
                              r={cell * 0.45}
                              fill="transparent"
                              style={{ pointerEvents: "all" }}
                              onClick={() => handlePlace(x, y)}
                           />
                           {color && (
                              <circle
                                 cx={cx}
                                 cy={cy}
                                 r={cell * 0.4}
                                 fill={
                                    color === "black" ? "#171717" : "#F8FAFC"
                                 }
                                 stroke={color === "white" ? "#0f172a" : "none"}
                                 strokeWidth={color === "white" ? 0.25 : 0}
                              />
                           )}
                        </g>
                     );
                  })
               )}
            </svg>

            {/* Lápiz superpuesto (no ocupa layout) */}
            <SketchCanvas
               attachRef={boardRef}
               ratio={1}
               active={showSketch}
               version={sketchVersion}
            />
         </div>
      </div>
   );
}
