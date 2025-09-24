import type { PlayResponse, StartResponse } from "@/lib/types/katago";

const BASE =
   (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(
      /\/$/,
      ""
   ) || "http://localhost:3000";

async function http<T>(path: string, init?: RequestInit): Promise<T> {
   const res = await fetch(`${BASE}${path}`, {
      headers: { "Content-Type": "application/json", ...(init?.headers ?? {}) },
      ...init,
   });

   let data: any = null;
   try {
      data = await res.json();
   } catch {
      /* ignore */
   }

   if (!res.ok) {
      const msg = data?.error || data?.message || `HTTP ${res.status}`;
      throw new Error(String(msg));
   }

   return data as T;
}

/**
 * Inicia partida en el backend (POST /game/start).
 */
export function startGame(): Promise<StartResponse> {
   return http<StartResponse>("/game/start", {
      method: "POST",
      body: JSON.stringify({}),
   });
}

/**
 * Envía un movimiento del jugador (ej: "B2") y recibe respuesta del bot.
 */
export function playMove(move: string): Promise<PlayResponse> {
   return http<PlayResponse>("/game/play", {
      method: "POST",
      body: JSON.stringify({ move }),
   });
}

/**
 * Apaga el motor (POST /game/shutdown).
 */
export function shutdownEngine(): Promise<void> {
   return http<void>("/game/shutdown", {
      method: "POST",
      body: JSON.stringify({}),
   });
}
