import { useMemo } from "react";

type Item = { move: string; by: "player" | "bot" };

export default function MoveStrip({ history }: { history: Item[] }) {
   const items = useMemo(
      () => history.map((h, i) => ({ ...h, n: i + 1 })),
      [history]
   );

   return (
      <div
         className="w-full overflow-x-auto rounded-lg border border-[#2a3b48] bg-[#1b2a39] px-2 py-1.5"
         aria-label="Estado de movimiento"
      >
         <div className="flex items-center gap-3 text-xs whitespace-nowrap">
            {items.length === 0 && (
               <span className="opacity-70">Sin jugadas todavía</span>
            )}

            {items.map((it, idx) => {
               const isPlayer = it.by === "player"; // negro = jugador
               return (
                  <div key={idx} className="flex items-center">
                     {/* Disco 20px */}
                     <div
                        className="relative z-10 grid h-5 w-5 shrink-0 place-items-center rounded-full"
                        title={`${
                           isPlayer ? "Jugador" : "Bot"
                        }: ${it.move.toUpperCase()}`}
                        style={{
                           background: isPlayer ? "#171717" : "#F8FAFC",
                           border: isPlayer ? "0" : "1px solid #0f172a",
                        }}
                     >
                        <span
                           className={`text-[10px] font-semibold leading-none ${
                              isPlayer ? "text-white" : "text-slate-800"
                           }`}
                        >
                           {it.n}
                        </span>
                     </div>

                     {/* Conector unido: usa DIV (block) para respetar width/height */}
                     {idx < items.length - 1 && (
                        <div
                           aria-hidden
                           className="z-0 mx-0 h-px w-12 shrink-0 bg-white/30 -ml-[10px] -mr-[10px] block"
                        />
                     )}
                  </div>
               );
            })}
         </div>
      </div>
   );
}
