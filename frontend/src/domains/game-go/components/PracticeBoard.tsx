import { useEffect, useMemo, useState } from "react";
import type { Move, StoneMap } from "@/lib/types/ui";

const SIZE = 19;
const LETTERS = "ABCDEFGHJKLMNOPQRST";

interface Props {
   /** Piedras reales de la partida (se sincroniza automáticamente) */
   baseMoves: Move[];
   /** Color inicial para explorar */
   startColor?: "black" | "white";
}

export default function PracticeBoard({
   baseMoves,
   startColor = "white",
}: Props) {
   const [hypoMoves, setHypoMoves] = useState<Move[]>([]);
   const [turn, setTurn] = useState<"black" | "white">(startColor);

   // Cuando cambia el estado real de la partida, reseteamos la exploración
   useEffect(() => {
      setHypoMoves([]);
      setTurn(startColor);
   }, [baseMoves, startColor]);

   // Mapa de ocupación con base + hipotéticas
   const stonesMap: StoneMap = useMemo(() => {
      const o: StoneMap = {};
      for (const m of baseMoves) o[`${m.x},${m.y}`] = m.color;
      for (const m of hypoMoves) o[`${m.x},${m.y}`] = m.color;
      return o;
   }, [baseMoves, hypoMoves]);

   const gridSize = 100;
   const cell = gridSize / (SIZE - 1);

   const handlePlace = (x: number, y: number) => {
      // ❌ No permitir sobre-escribir (base o hypo)
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

   const swapTurn = () => setTurn((t) => (t === "black" ? "white" : "black"));

   return (
      <div className="space-y-2">
         <div className="flex items-center justify-between text-xs">
            <span className="opacity-80">
               Turno: {turn === "black" ? "Negras" : "Blancas"}
            </span>
            <div className="flex gap-2">
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
            </div>
         </div>

         <svg
            viewBox={`0 0 ${gridSize} ${gridSize}`}
            className="w-full aspect-square rounded shadow"
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
                     <g key={key} className="cursor-pointer">
                        {/* Área de click SIEMPRE presente */}
                        <circle
                           cx={cx}
                           cy={cy}
                           r={cell * 0.45}
                           fill="transparent"
                           // garantizamos que capture eventos aunque esté vacío
                           style={{ pointerEvents: "all" }}
                           onClick={() => handlePlace(x, y)}
                        />
                        {/* Piedra si existe (base o hypo) */}
                        {color && (
                           <circle
                              cx={cx}
                              cy={cy}
                              r={cell * 0.4}
                              fill={color === "black" ? "#171717" : "#F8FAFC"}
                              stroke={color === "white" ? "#0f172a" : "none"}
                              strokeWidth={color === "white" ? 0.25 : 0}
                           />
                        )}
                     </g>
                  );
               })
            )}
         </svg>
      </div>
   );
}
