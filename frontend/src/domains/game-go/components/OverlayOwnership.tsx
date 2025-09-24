import React from "react";

type Props = {
   ownership?: number[]; // -1..1, len = 361
   size?: number; // px del lado del SVG
   boardSize?: number; // default 19
};

const LETTERS = "ABCDEFGHJKLMNOPQRST";

export default function OwnershipMap({
   ownership,
   size = 300,
   boardSize = 19,
}: Props) {
   if (!ownership || ownership.length !== boardSize * boardSize) {
      return (
         <div className="text-sm opacity-70">
            Sin ownership disponible todavía.
         </div>
      );
   }

   // padding para etiquetas
   const PAD_TOP = 18; // px
   const PAD_LEFT = 22; // px
   const innerW = size - PAD_LEFT - 8;
   const innerH = size - PAD_TOP - 8;
   const cellX = innerW / (boardSize - 1);
   const cellY = innerH / (boardSize - 1);
   const r = Math.max(4, Math.min(cellX, cellY) * 0.47);

   return (
      <svg
         width={size}
         height={size}
         viewBox={`0 0 ${size} ${size}`}
         className="rounded-md shadow border border-[#2a3b48]"
         style={{ background: "#deb887" }}
         aria-label="Ownership map"
      >
         {/* Grid */}
         {[...Array(boardSize)].map((_, i) => {
            const x = PAD_LEFT + i * cellX;
            const y = PAD_TOP + i * cellY;
            return (
               <g key={`g-${i}`}>
                  <line
                     x1={PAD_LEFT}
                     y1={y}
                     x2={PAD_LEFT + innerW}
                     y2={y}
                     stroke="#333"
                     strokeWidth={0.8}
                  />
                  <line
                     x1={x}
                     y1={PAD_TOP}
                     x2={x}
                     y2={PAD_TOP + innerH}
                     stroke="#333"
                     strokeWidth={0.8}
                  />
               </g>
            );
         })}

         {/* Etiquetas KGS */}
         {[...Array(boardSize)].map((_, i) => (
            <text
               key={`L-${i}`}
               x={PAD_LEFT + i * cellX}
               y={12}
               textAnchor="middle"
               fontSize="10"
               fill="#263238"
            >
               {LETTERS[i]}
            </text>
         ))}
         {[...Array(boardSize)].map((_, i) => (
            <text
               key={`N-${i}`}
               x={10}
               y={PAD_TOP + i * cellY + 3}
               textAnchor="middle"
               fontSize="10"
               fill="#263238"
            >
               {19 - i}
            </text>
         ))}

         {/* Círculos de ownership */}
         {Array.from({ length: boardSize }).map((_, y) =>
            Array.from({ length: boardSize }).map((_, x) => {
               const v = ownership[y * boardSize + x]; // asumido fila 0 = 19
               if (v == null) return null;

               let color: string | null = null;
               if (v > 0.05)
                  color = `rgba(100,100,255,${Math.min(
                     Math.abs(v),
                     0.6
                  )})`; // blancas
               else if (v < -0.05)
                  color = `rgba(255,100,100,${Math.min(
                     Math.abs(v),
                     0.6
                  )})`; // negras
               else return null;

               const cx = PAD_LEFT + x * cellX;
               const cy = PAD_TOP + y * cellY;

               return (
                  <circle
                     key={`o-${x}-${y}`}
                     cx={cx}
                     cy={cy}
                     r={r}
                     fill={color}
                  />
               );
            })
         )}
      </svg>
   );
}
