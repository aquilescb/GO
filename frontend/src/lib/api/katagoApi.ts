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
   let data = null;
   try {
      data = await res.json();
   } catch {
      /* empty */
   }
   if (!res.ok)
      throw new Error(
         String(data?.error || data?.message || `HTTP ${res.status}`)
      );
   return data as T;
}

/* ===== Tipos de configuración ===== */
export type Preset = "easy" | "medium" | "hard" | "pro";
export type Hardware = "cpu-low" | "cpu-mid" | "gpu";

export type EngineConfig = {
   preset: Preset;
   hardware: Hardware;
   networkFilename: string;
   networksDir: string;
   boardSize: number;
   komi: number;
   rules: string;
   // puede venir con overrides activos
   overrides?: {
      maxVisits?: number;
      selectionTemperature?: number;
      numSearchThreads?: number;
      analysisPVLen?: number;
      wideRootNoise?: number;
   };
};

export type RuntimeOverrides = Partial<NonNullable<EngineConfig["overrides"]>>;

export type NetworkEntry = { filename: string; fullpath: string };
export type NetworksResponse = { dir: string; files: NetworkEntry[] };

/* ===== Game ===== */
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

/* ===== Config ===== */
export function getKataConfig() {
   return http<EngineConfig>("/game/config", { method: "GET" });
}
export function applyKataConfig(body: {
   preset?: Preset;
   hardware?: Hardware;
   networkFilename?: string;
}) {
   return http<{ status: "ok"; applied: EngineConfig }>("/game/config/apply", {
      method: "POST",
      body: JSON.stringify(body),
   });
}

/* ===== NUEVO: listar redes ===== */
export function getKataNetworks() {
   return http<NetworksResponse>("/game/networks", { method: "GET" });
}

/* ===== NUEVO: overrides (maxVisits, temperatura, etc.) ===== */
export function overrideKataConfig(overrides: RuntimeOverrides) {
   return http<{ status: "ok"; overrides: EngineConfig["overrides"] }>(
      "/game/config/override",
      {
         method: "POST",
         body: JSON.stringify(overrides),
      }
   );
}
