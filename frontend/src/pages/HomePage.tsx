import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setEngine, startGame } from "@/domains/game-go/gameApi";

export default function HomePage() {
  const [selectedEngine, setSelectedEngine] = useState<'pachi' | 'gnugo' |'leela'>('gnugo');
  const [booting, setBooting] = useState(false);
  const navigate = useNavigate();

  const handleStart =async () => {
    if (booting) return; // evita doble click
    try {
      setBooting(true);
      setEngine(selectedEngine);
      await startGame(); // espera ~7s aquí
      navigate("/game", { state: { engine: selectedEngine, engineStarted: true } });
    } catch (e) {
      console.error(e);
      alert("No se pudo iniciar el motor. Reintentá.");
      setBooting(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center h-screen text-white text-center space-y-8 bg-[#1c2e3f]">
      <h1 className="text-4xl font-bold text-yellow-400 drop-shadow">
        Bienvenido a Go Game
      </h1>

      <div className="flex items-center gap-4">
        <label className="text-lg font-semibold">Motor:</label>
        <select
          value={selectedEngine}
          onChange={(e) => setSelectedEngine(e.target.value as 'pachi' | 'gnugo' |'leela')}
          className="bg-gray-700 text-white px-3 py-2 rounded-lg"
        >
          <option value="pachi">Pachi</option>
          <option value="gnugo">GNU Go</option>
          <option value="leela">Leela Zero</option>
        </select>
      </div>
      <button
        onClick={handleStart}
        disabled={booting}
        className={`bg-yellow-500 text-black font-semibold px-6 py-3 rounded-lg shadow-lg transition
        ${booting ? "opacity-60 cursor-not-allowed" : "hover:bg-yellow-600"}`}
      >
        {booting ? "Iniciando motor…" : "Comenzar Partida"}
      </button>

      {booting && (
        <p className="text-sm text-gray-300 animate-pulse">
          Preparando {selectedEngine.toUpperCase()} (puede tardar unos segundos)…
        </p>
      )}
    </div>
  );
}
