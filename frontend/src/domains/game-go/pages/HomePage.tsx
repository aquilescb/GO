// src/domains/game-go/pages/HomePage.tsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { applyKataConfig, getKataConfig, startGame } from "@/lib/api/katagoApi";

const COLORS = {
   bg: "#1C2E3F",
   card: "#2D3E4E",
   text: "#F4F4F5",
   accent: "#BC9C23",
};

type Preset = "easy" | "medium" | "hard" | "pro";
type Hardware = "cpu-low" | "cpu-mid" | "gpu";

export default function HomePage() {
   const navigate = useNavigate();

   const [preset, setPreset] = useState<Preset>("medium");
   const [hardware, setHardware] = useState<Hardware>("cpu-low");
   const [networkFilename, setNetworkFilename] = useState<string>("");

   const [booting, setBooting] = useState(false);
   const [hint, setHint] = useState<string | null>(null);
   const [loadingCfg, setLoadingCfg] = useState(true);

   useEffect(() => {
      // lee configuración actual para precargar selects
      (async () => {
         try {
            const cfg = await getKataConfig();
            setPreset(cfg.preset);
            setHardware(cfg.hardware);
            setNetworkFilename(cfg.networkFilename ?? "");
         } catch {
            // si falla, seguimos con defaults
         } finally {
            setLoadingCfg(false);
         }
      })();
   }, []);

   async function handleApplyAndStart() {
      if (booting) return;
      try {
         setHint(null);
         setBooting(true);

         await applyKataConfig({
            preset,
            hardware,
            networkFilename: networkFilename?.trim() || undefined,
         });

         await startGame();
         navigate("/game");
      } catch (e: any) {
         setHint(
            e?.message || "No se pudo iniciar KataGo con esa configuración."
         );
         setBooting(false);
      }
   }

   return (
      <div
         className="min-h-screen w-full flex items-center justify-center px-4 py-8"
         style={{ backgroundColor: COLORS.bg, color: COLORS.text }}
      >
         <main className="w-full max-w-4xl">
            <header className="text-center">
               <h1
                  className="text-4xl font-extrabold"
                  style={{ color: COLORS.accent }}
               >
                  KataGo — Configuración rápida
               </h1>
               <p className="opacity-80 mt-2">
                  Elegí nivel de dificultad, perfil de hardware y (opcional) la
                  red neuronal.
               </p>
            </header>

            {/* Config cards */}
            <section className="mt-8 grid gap-4 md:grid-cols-3">
               {/* Preset */}
               <div
                  className="rounded-2xl p-4 shadow-lg"
                  style={{ backgroundColor: COLORS.card }}
               >
                  <h3 className="font-semibold mb-2">Dificultad</h3>
                  <div className="relative">
                     <select
                        className="w-full rounded-lg px-3 py-2 border border-white/20 bg-[#1F2633] text-white
                           focus:outline-none focus:ring-2 focus:ring-[#BC9C23] appearance-none"
                        value={preset}
                        onChange={(e) => setPreset(e.target.value as Preset)}
                     >
                        <option
                           value="easy"
                           style={{ color: "#111827", background: "#ffffff" }}
                        >
                           Easy (rápido)
                        </option>
                        <option
                           value="medium"
                           style={{ color: "#111827", background: "#ffffff" }}
                        >
                           Medium (equilibrado)
                        </option>
                        <option
                           value="hard"
                           style={{ color: "#111827", background: "#ffffff" }}
                        >
                           Hard (calidad ↑)
                        </option>
                        <option
                           value="pro"
                           style={{ color: "#111827", background: "#ffffff" }}
                        >
                           Pro (requiere GPU)
                        </option>
                     </select>
                     {/* Flecha custom */}
                     <svg
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                     >
                        <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.17l3.71-2.94a.75.75 0 1 1 .94 1.16l-4.2 3.33a.75.75 0 0 1-.94 0l-4.2-3.33a.75.75 0 0 1 .02-1.18z" />
                     </svg>
                  </div>
                  <p className="text-sm opacity-70 mt-2">
                     Controla principalmente <em>maxVisits</em> (tiempo vs.
                     calidad).
                  </p>
               </div>

               {/* Hardware */}
               <div
                  className="rounded-2xl p-4 shadow-lg"
                  style={{ backgroundColor: COLORS.card }}
               >
                  <h3 className="font-semibold mb-2">Hardware</h3>
                  <div className="relative">
                     <select
                        className="w-full rounded-lg px-3 py-2 border border-white/20 bg-[#1F2633] text-white
                           focus:outline-none focus:ring-2 focus:ring-[#BC9C23] appearance-none"
                        value={hardware}
                        onChange={(e) =>
                           setHardware(e.target.value as Hardware)
                        }
                     >
                        <option
                           value="cpu-low"
                           style={{ color: "#111827", background: "#ffffff" }}
                        >
                           CPU baja (containers chicos)
                        </option>
                        <option
                           value="cpu-mid"
                           style={{ color: "#111827", background: "#ffffff" }}
                        >
                           CPU media (8–16 vCPU)
                        </option>
                        <option
                           value="gpu"
                           style={{ color: "#111827", background: "#ffffff" }}
                        >
                           GPU (T4/A10/RTX)
                        </option>
                     </select>
                     <svg
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 opacity-70"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                     >
                        <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.17l3.71-2.94a.75.75 0 1 1 .94 1.16l-4.2 3.33a.75.75 0 0 1-.94 0l-4.2-3.33a.75.75 0 0 1 .02-1.18z" />
                     </svg>
                  </div>
                  <p className="text-sm opacity-70 mt-2">
                     Ajusta hilos de búsqueda y batch NN.
                  </p>
               </div>

               {/* Network */}
               <div
                  className="rounded-2xl p-4 shadow-lg"
                  style={{ backgroundColor: COLORS.card }}
               >
                  <h3 className="font-semibold mb-2">
                     Red neuronal (opcional)
                  </h3>
                  <input
                     className="w-full rounded-lg px-3 py-2 border border-white/20 bg-[#1F2633] text-white
                         placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#BC9C23]"
                     placeholder="kata1-b15c192-....txt.gz"
                     value={networkFilename}
                     onChange={(e) => setNetworkFilename(e.target.value)}
                     spellCheck={false}
                  />
                  <p className="text-xs opacity-70 mt-2">
                     Archivo dentro de <code>/engines/katago/networks</code>.
                     Dejalo vacío para mantener la actual.
                  </p>
               </div>
            </section>

            {/* Atajos recomendados */}
            <section className="mt-6">
               <div className="flex flex-wrap items-center gap-2">
                  <button
                     onClick={() => {
                        setPreset("easy");
                        setHardware("cpu-low");
                     }}
                     className="px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5"
                  >
                     Rápido (CPU baja)
                  </button>
                  <button
                     onClick={() => {
                        setPreset("medium");
                        setHardware("cpu-mid");
                     }}
                     className="px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5"
                  >
                     Equilibrado (CPU media)
                  </button>
                  <button
                     onClick={() => {
                        setPreset("pro");
                        setHardware("gpu");
                     }}
                     className="px-3 py-2 rounded-lg border border-white/10 hover:bg-white/5"
                  >
                     Análisis (GPU)
                  </button>
               </div>
            </section>

            {/* Call-to-action */}
            <div className="mt-8 text-center">
               <button
                  onClick={handleApplyAndStart}
                  disabled={booting || loadingCfg}
                  className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-xl shadow-lg
                       hover:brightness-110 disabled:opacity-60"
                  style={{ backgroundColor: COLORS.accent, color: "#111827" }}
               >
                  {booting ? "Iniciando…" : "Aplicar y jugar"}
               </button>
               {hint && <p className="text-sm opacity-80 mt-3">{hint}</p>}
               {loadingCfg && (
                  <p className="text-sm opacity-60 mt-2">
                     Cargando configuración…
                  </p>
               )}
            </div>
         </main>
      </div>
   );
}
