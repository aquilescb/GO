// src/domains/game-go/pages/HomePage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
   applyKataConfig,
   getKataConfig,
   getKataNetworks,
   overrideKataConfig,
   startGame,
   type EngineConfig,
   type NetworkEntry,
   type Preset,
   type Hardware,
} from "@/lib/api/katagoApi";

const COLORS = {
   bg: "#1C2E3F",
   card: "#2D3E4E",
   text: "#F4F4F5",
   accent: "#BC9C23",
};

type NetId = "known" | "custom";

export default function HomePage() {
   const navigate = useNavigate();

   const [preset, setPreset] = useState<Preset>("medium");
   const [hardware, setHardware] = useState<Hardware>("cpu-low");

   const [netMode, setNetMode] = useState<NetId>("known");
   const [networks, setNetworks] = useState<NetworkEntry[]>([]);
   const [selectedNet, setSelectedNet] = useState<string>("");
   const [customNet, setCustomNet] = useState<string>("");

   const [overMaxVisits, setOverMaxVisits] = useState<number | "">("");
   const [overTemp, setOverTemp] = useState<number | "">("");

   const [booting, setBooting] = useState(false);
   const [hint, setHint] = useState<string | null>(null);
   const [loading, setLoading] = useState(true);

   const effectiveFilename = useMemo(
      () => (netMode === "custom" ? customNet.trim() : selectedNet),
      [netMode, customNet, selectedNet]
   );

   useEffect(() => {
      (async () => {
         try {
            const cfg = await getKataConfig();
            hydrateFromCfg(cfg);

            const list = await getKataNetworks();
            setNetworks(list.files);

            // 👇 preferimos SIEMPRE el modo "known" si hay redes
            if (list.files.length > 0) {
               const match = pickNetMatch(list.files, cfg.networkFilename);

               setNetMode("known");
               if (match) {
                  // si matchea por filename o baseName, seleccionamos su filename
                  setSelectedNet(match.filename);
               } else {
                  // sin match: dejamos el select sin elegir
                  setSelectedNet("");
               }
            } else {
               // no hay archivos en disco -> permitir custom
               setNetMode("custom");
               setCustomNet(cfg.networkFilename ?? "");
            }
         } catch (e: any) {
            setHint(e?.message ?? "No se pudo leer configuración inicial.");
         } finally {
            setLoading(false);
         }
      })();
   }, []);

   function hydrateFromCfg(cfg: EngineConfig) {
      setPreset(cfg.preset);
      setHardware(cfg.hardware);
      // si había overrides, los muestro
      if (cfg.overrides?.maxVisits) setOverMaxVisits(cfg.overrides.maxVisits);
      if (cfg.overrides?.selectionTemperature !== undefined)
         setOverTemp(cfg.overrides.selectionTemperature!);
   }

   async function handleApplyAndStart() {
      if (booting) return;
      setHint(null);
      setBooting(true);
      try {
         await applyKataConfig({
            preset,
            hardware,
            networkFilename: effectiveFilename || undefined,
         });

         // Aplicar overrides si el usuario tocó algo
         const overrides: Record<string, number> = {};
         if (typeof overMaxVisits === "number" && overMaxVisits > 0)
            overrides.maxVisits = overMaxVisits;
         if (typeof overTemp === "number" && overTemp >= 0)
            overrides.selectionTemperature = overTemp;
         if (Object.keys(overrides).length) await overrideKataConfig(overrides);

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
         <main className="w-full max-w-5xl">
            <header className="text-center">
               <h1
                  className="text-4xl font-extrabold"
                  style={{ color: COLORS.accent }}
               >
                  KataGo — Configuración
               </h1>
               <p className="opacity-80 mt-2">
                  Elegí dificultad, hardware y red. Opcional: overrides.
               </p>
            </header>

            {/* Preset + Hardware */}
            <section className="mt-8 grid gap-4 md:grid-cols-3">
               <Card title="Dificultad">
                  <Select
                     value={preset}
                     onChange={(v) => setPreset(v as Preset)}
                  >
                     <option value="easy">Easy (rápido)</option>
                     <option value="medium">Medium (equilibrado)</option>
                     <option value="hard">Hard (calidad ↑)</option>
                     <option value="pro">Pro (alto costo)</option>
                  </Select>
                  <p className="text-sm opacity-70 mt-2">
                     Controla principalmente <em>maxVisits</em>.
                  </p>
               </Card>

               <Card title="Hardware">
                  <Select
                     value={hardware}
                     onChange={(v) => setHardware(v as Hardware)}
                  >
                     <option value="cpu-low">CPU baja</option>
                     <option value="cpu-mid">CPU media</option>
                     <option value="gpu">GPU</option>
                  </Select>
                  <p className="text-sm opacity-70 mt-2">
                     Hilos y batch se auto-ajustan.
                  </p>
               </Card>

               {/* Redes */}
               <Card title="Red neuronal">
                  {netMode === "known" ? (
                     <Select value={selectedNet} onChange={setSelectedNet}>
                        <option value="">(Elegir)</option>
                        {networks.map((f) => (
                           <option key={f.filename} value={f.filename}>
                              {f.filename}
                           </option>
                        ))}
                     </Select>
                  ) : (
                     <Input
                        value={customNet}
                        setValue={setCustomNet}
                        placeholder="kata1-b15c192-… (.bin.gz o .txt.gz)"
                     />
                  )}
                  <p className="text-xs opacity-70 mt-2">
                     {networks.length
                        ? `Encontradas: ${networks.length}`
                        : "No se detectaron modelos (.bin.gz o .txt.gz)"}
                  </p>
               </Card>
            </section>

            {/* Overrides simples */}
            <section className="mt-6 grid gap-4 md:grid-cols-2">
               <Card title="Avanzado — Overrides (opcional)">
                  <div className="grid gap-3">
                     <LabeledInput
                        label="maxVisits"
                        type="number"
                        min={20}
                        placeholder="p.ej. 120, 400, 1000…"
                        value={overMaxVisits}
                        onChange={(v) =>
                           setOverMaxVisits(v === "" ? "" : Number(v))
                        }
                     />
                     <LabeledInput
                        label="Temperatura de selección"
                        type="number"
                        step="0.05"
                        min={0}
                        max={1}
                        placeholder="0 (siempre mejor) … 1 (más variado)"
                        value={overTemp}
                        onChange={(v) => setOverTemp(v === "" ? "" : Number(v))}
                     />
                     <p className="text-xs opacity-70">
                        Si dejas vacío, se usan los valores del preset elegido.
                     </p>
                  </div>
               </Card>
            </section>

            {/* CTA */}
            <div className="mt-8 text-center">
               <button
                  onClick={handleApplyAndStart}
                  disabled={booting || loading}
                  className="inline-flex items-center gap-2 font-semibold px-6 py-3 rounded-xl shadow-lg hover:brightness-110 disabled:opacity-60"
                  style={{ backgroundColor: COLORS.accent, color: "#111827" }}
               >
                  {booting ? "Iniciando…" : "Aplicar y jugar"}
               </button>
               {hint && <p className="text-sm opacity-80 mt-3">{hint}</p>}
               {loading && <p className="text-sm opacity-60 mt-2">Cargando…</p>}
            </div>
         </main>
      </div>
   );
}

/* ——— pequeños componentes UI ——— */
function Card({
   title,
   children,
}: {
   title: string;
   children: React.ReactNode;
}) {
   return (
      <div
         className="rounded-2xl p-4 shadow-lg"
         style={{ backgroundColor: COLORS.card }}
      >
         <h3 className="font-semibold mb-2">{title}</h3>
         {children}
      </div>
   );
}
function Select({
   value,
   onChange,
   children,
}: {
   value: string;
   onChange: (v: string) => void;
   children: React.ReactNode;
}) {
   return (
      <select
         className="w-full rounded-lg px-3 py-2 border border-white/20 bg-[#1F2633] text-white focus:outline-none focus:ring-2 focus:ring-[#BC9C23]"
         value={value}
         onChange={(e) => onChange(e.target.value)}
      >
         {children}
      </select>
   );
}
function Input({
   value,
   setValue,
   placeholder,
}: {
   value: string;
   setValue: (v: string) => void;
   placeholder?: string;
}) {
   return (
      <input
         className="w-full rounded-lg px-3 py-2 border border-white/20 bg-[#1F2633] text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-[#BC9C23]"
         value={value}
         onChange={(e) => setValue(e.target.value)}
         placeholder={placeholder}
         spellCheck={false}
      />
   );
}
function LabeledInput(
   props: React.InputHTMLAttributes<HTMLInputElement> & {
      label: string;
      onChange: (v: string) => void;
   }
) {
   const { label, onChange, ...rest } = props;
   return (
      <label className="block">
         <span className="text-sm opacity-90">{label}</span>
         <input
            {...rest}
            className="mt-1 w-full rounded-lg px-3 py-2 border border-white/20 bg-[#1F2633] text-white focus:outline-none focus:ring-2 focus:ring-[#BC9C23]"
            onChange={(e) => onChange(e.target.value)}
         />
      </label>
   );
}
function pickNetMatch(
   files: NetworkEntry[],
   cfgName: string | undefined | null
): NetworkEntry | undefined {
   if (!cfgName) return undefined;
   const name = cfgName.trim();
   return files.find((f) => f.filename === name || f.baseName === name);
}
