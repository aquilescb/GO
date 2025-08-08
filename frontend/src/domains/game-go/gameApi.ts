import type { GameResponse } from "./types/game";
let currentEngine: 'pachi' | 'gnugo' | 'leela'= 'gnugo'; // por defecto

export const setEngine = (engine: 'pachi' | 'gnugo' |'leela') => {
  currentEngine = engine;
};

const BASE_URL = () => `http://localhost:3000/game`;

export const startGame = async () => {
  const response = await fetch(`${BASE_URL()}/start`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ engine: currentEngine }),
  });
  if (!response.ok) throw new Error('Error al iniciar la partida');
};

export const playMove = async (color: string, move: string): Promise<GameResponse> => {
  const response = await fetch(`${BASE_URL()}/play`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ color, move }),
  });

  if (!response.ok) throw new Error('Error al enviar jugada');

  const data = await response.json();
  return data;
};

export async function shutdownEngine() {
  await fetch(`${BASE_URL()}/shutdown`, { 
    method: 'POST' });
}