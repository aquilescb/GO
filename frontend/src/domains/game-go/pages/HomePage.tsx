import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { startGame } from "@/lib/api/katagoApi";

const COLORS = {
   bg: "#1C2E3F",
   card: "#2D3E4E",
   text: "#F4F4F5",
   accent: "#BC9C23",
};

export default function HomePage() {
   const navigate = useNavigate();
   const [booting, setBooting] = useState(false);
   const [hint, setHint] = useState<string | null>(null);

   const handleStart = async () => {
      if (booting) return;
      try {
         setBooting(true);
         setHint(null);
         await startGame();
         navigate("/game");
      } catch (e: any) {
         setHint(e?.message || "No se pudo iniciar KataGo.");
         setBooting(false);
      }
   };

   return (
      <div
         className="min-h-screen w-full flex items-center justify-center px-4 py-8"
         style={{ backgroundColor: COLORS.bg, color: COLORS.text }}
      >
         <main className="w-full max-w-4xl text-center">
            <h1
               className="text-4xl font-extrabold"
               style={{ color: COLORS.accent }}
            >
               KataGo — Play
            </h1>
            <p className="opacity-80 mt-2">
               Iniciá la sesión del motor y empezá a jugar.
            </p>
            <div className="mt-8">
               <button
                  onClick={handleStart}
                  disabled={booting}
                  className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-xl shadow-lg hover:brightness-110 disabled:opacity-60"
                  style={{ backgroundColor: COLORS.accent, color: "#111827" }}
               >
                  {booting ? "Iniciando…" : "Comenzar partida"}
               </button>
            </div>
            {hint && <p className="text-sm opacity-80 mt-3">{hint}</p>}
         </main>
      </div>
   );
}
