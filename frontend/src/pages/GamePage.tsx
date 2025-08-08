import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Board from '@/domains/game-go/components/Board';
import type { Move, GameResponse } from '@/domains/game-go/types/game';
import { coordToXY } from '@/domains/game-go/lib/gameLogic';
import { setEngine, startGame, playMove, shutdownEngine } from '@/domains/game-go/gameApi';
import AnalysisCanvas from '@/domains/game-go/components/AnalysisCanvas';
import type { StoneMap } from '@/domains/game-go/types/game';

export default function GamePage() {
  const location = useLocation();
  const navigate = useNavigate();
  const selectedEngine = location.state?.engine as 'pachi' | 'gnugo' | 'leela' | undefined;
  const engineStarted = Boolean(location.state?.engineStarted);
  const [moves, setMoves] = useState<Move[]>([]);
  const [botThinking, setBotThinking] = useState(false);
  const [score, setScore] = useState<string | null>(null);
  const [captures, setCaptures] = useState<{ black: number; white: number }>({ black: 0, white: 0 });
  const [analysisType, setAnalysisType] = useState<'influence' | 'territory' | 'priority'>('influence');
  const [moveHistory, setMoveHistory] = useState<{ move: string; by: 'player' | 'bot' }[]>([]);

useEffect(() => {
  if (!selectedEngine) {
    navigate('/');
    return;
  }

  setEngine(selectedEngine);

  // Siempre reset visual
  setMoves([]);
  setMoveHistory([]);
  setScore(null);
  setCaptures({ black: 0, white: 0 });

  // Si ya venimos con el motor listo, NO bloqueamos ni llamamos startGame de nuevo.
  if (engineStarted) return;

  // Si alguien pegó el salto directo a /game, intentamos arrancar,
  // pero SIN poner botThinking=true (no bloqueamos el primer click).
  (async () => {
    try {
      await startGame(); // el back devolverá "ya estaba iniciado" o lo inicia
    } catch (err) {
      console.error(err);
      alert('Error al iniciar partida');
      navigate('/');
    }
  })();
}, [navigate, selectedEngine, engineStarted]);
  const handlePlay = async (coord: string) => {
    if (botThinking) return;

    const playerMove: Move = { ...coordToXY(coord), color: 'black' };
    const newMoves = [...moves, playerMove];
    setMoves(newMoves);
    setMoveHistory((prev) => [...prev, { move: coord, by: 'player' }]);
    setBotThinking(true);
    try {
      const data: GameResponse = await playMove('black', coord);
      const botMove: Move = { ...coordToXY(data.botMove), color: 'white' };
      setMoves([...newMoves, botMove]);

      setMoveHistory((prev) => [...prev, { move: data.botMove, by: 'bot' }]);
      if (data.score && /^([BW])\+([\d.]+)/.test(data.score)) {
        setScore(data.score);
      }
      setCaptures(data.details.captures);
    } catch (err) {
      console.error(err);
      alert('Error al jugar');
    } finally {
      setBotThinking(false);
    }
  };

  function parseScore(score: string): string {
    if (!score) return 'Sin estimación';

    const match = score.match(/^([BW])\+([\d.]+)/);
    if (!match) return 'Estimación inválida';

    const color = match[1] === 'B' ? 'negras' : 'blancas';
    const puntos = match[2];
    return `Ganan las ${color} por ${puntos} puntos`;
  }

  const stones: StoneMap = {};
  moves.forEach((move) => {
    stones[`${move.x},${move.y}`] = move.color;
  });

  return (
    <div className="flex flex-col lg:flex-row gap-4 p-4 min-h-screen bg-[#1c2e3f] w-full">
      {/* Panel lateral izquierdo */}
      <div className="w-full lg:max-w-[300px] flex flex-col gap-4">
        <button
          onClick={async () => {
            await shutdownEngine();
            navigate('/');
          }}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 w-full shadow-md"
        >
          Volver al Inicio
        </button>

        <div className="bg-[#2d3e4e] text-white p-4 rounded-lg shadow border border-gray-600">
          <h3 className="font-semibold mb-2 text-yellow-400">Asistente Bot 🤖</h3>
          {botThinking ? (
            <span className="text-sm">Pensando...</span>
          ) : (
            <span className="text-sm text-green-400">Esperando jugada...</span>
          )}
        </div>

        <div className="text-sm space-y-1">
          {selectedEngine === 'gnugo' && score && (
            <div>
              <span className="text-gray-300">Score estimado:</span>{' '}
              <span className="text-yellow-300 font-medium">{parseScore(score)}</span>
            </div>
          )}
          <div>
            <span className="text-gray-300">Capturas:</span>{' '}
            <span className="text-blue-400">⚫ {captures.black}</span> –{' '}
            <span className="text-white">⚪ {captures.white}</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 mt-4">
          <label className="text-sm text-gray-400 font-semibold">Vista de análisis</label>
          <select
            value={analysisType}
            onChange={(e) => setAnalysisType(e.target.value as 'influence' | 'territory' | 'priority')}
            className="bg-[#2d3e4e] border border-gray-600 text-white text-sm rounded px-3 py-1"
          >
            <option value="influence">🟦 Influencia</option>
            <option value="territory">⚪ Territorio</option>
            <option value="priority">🔥 Prioridad</option>
          </select>
          <div className="mt-6">
            <AnalysisCanvas type={analysisType} stones={stones} />
          </div>
        </div>
      </div>

      {/* Tablero centrado */}
      <div className="flex-grow flex justify-center items-start">
        <Board moves={moves} onPlay={handlePlay} botThinking={botThinking} />
      </div>

      {/* Panel lateral derecho */}
      <div className="w-full lg:max-w-[300px] bg-[#2d3e4e] text-white rounded-lg shadow p-4 border border-gray-600 max-h-[calc(100vh-32px)] overflow-y-auto">
        <h3 className="text-yellow-400 font-semibold mb-2">Movimientos</h3>
        <ol className="text-sm space-y-1">
          {moveHistory.map((m, i) => (
            <li key={i} className="flex justify-between">
              <span className="text-gray-300">#{i + 1}</span>
              <span className={m.by === 'player' ? 'text-blue-300' : 'text-red-300'}>
                {m.by === 'player' ? '🧑' : '🤖'} {m.move.toUpperCase()}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}