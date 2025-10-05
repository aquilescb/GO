import { useMemo } from "react";

type Item = { move: string; by: "player" | "bot" };

export default function MoveStrip({ history }: { history: Item[] }) {
   const items = useMemo(
      () => history.map((h, i) => ({ ...h, n: i + 1 })),
      [history]
   );

   return (
      <div
         className="w-full overflow-x-auto rounded-lg border border-[#2a3b48] bg-[#1b2a39] px-3 py-2"
         aria-label="Estado de movimiento"
      >
         <div className="flex items-center gap-3 text-sm whitespace-nowrap">
            {items.length === 0 && (
               <span className="opacity-70">Sin jugadas todavía</span>
            )}

            {items.map((it, idx) => (
               <div key={idx} className="flex items-center gap-3">
                  {/* disco con número */}
                  <div
                     className="relative inline-flex items-center justify-center"
                     title={`${
                        it.by === "player" ? "Jugador" : "Bot"
                     }: ${it.move.toUpperCase()}`}
                  >
                     <svg
                        width="26"
                        height="26"
                        viewBox="0 0 26 26"
                        aria-hidden
                     >
                        <circle
                           cx="13"
                           cy="13"
                           r="11"
                           fill={it.by === "player" ? "#171717" : "#F8FAFC"}
                           stroke={it.by === "player" ? "none" : "#0f172a"}
                           strokeWidth={it.by === "player" ? 0 : 1}
                        />
                     </svg>
                     <span
                        className={`absolute text-[11px] font-semibold ${
                           it.by === "player" ? "text-white" : "text-slate-800"
                        }`}
                        style={{ lineHeight: 1 }}
                     >
                        {it.n}
                     </span>
                  </div>

                  {idx < items.length - 1 && (
                     <span className="opacity-60">→</span>
                  )}
               </div>
            ))}
         </div>
      </div>
   );
}
