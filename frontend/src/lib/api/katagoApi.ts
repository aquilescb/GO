// src/lib/api/katagoApi.ts
import type { PlayEvalV2Response } from "@/lib/types/katago";

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
   // eslint-disable-next-line @typescript-eslint/no-explicit-any
   let data: any = null;
   try {
      data = await res.json();
   } catch {
      /* empty */
   }
   if (!res.ok) {
      throw new Error(
         String(data?.error || data?.message || `HTTP ${res.status}`)
      );
   }
   return data as T;
}

export function startGame() {
   return http<{ status: "ok"; message: string }>("/game/start", {
      method: "POST",
      body: "{}",
   });
}
export function shutdownEngine() {
   return http<{ status: "ok" }>("/game/shutdown", {
      method: "POST",
      body: "{}",
   });
}
export function playEval(move: string): Promise<PlayEvalV2Response> {
   return http<PlayEvalV2Response>("/game/play-eval", {
      method: "POST",
      body: JSON.stringify({ move }),
   });
}
