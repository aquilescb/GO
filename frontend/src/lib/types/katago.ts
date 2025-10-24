// src/lib/types/katago.ts
export type KgVertex = string;
export type Color = "b" | "w";

export interface CandidateBlack {
   move: KgVertex;
   prior: number;
   winrateBlack: number; // 0..1 (normalizado al color objetivo del bloque)
   scoreMeanBlack: number; // pts con signo desde el color objetivo
   pv: KgVertex[];
}

export type DeltaSeverity = "perfect" | "inaccuracy" | "mistake" | "blunder";

export interface PlayEvalV2Response {
   MovBot: { botMove: KgVertex; candidates: CandidateBlack[] };
   MovUser: { recommendations: CandidateBlack[] };
   metrics: {
      // Comparación 1-ply (baseline best vs jugada usuario)
      bestWRPre: number;
      wrAfterUser: number;
      lossWinrate: number; // = bestWRPre - wrAfterUser (puede ser <0 si mejoró)
      bestScorePre: number;
      scoreAfterUser: number;
      lossPoints: number; // = bestScorePre - scoreAfterUser

      // Magnitudes y banderas (opcionales)
      absLossWinrate?: number;
      absLossPoints?: number;
      isImprovement?: boolean;

      // === NUEVO: estado GLOBAL de la partida (desde el color del usuario)
      globalBefore: { wrUser: number; scoreUser: number }; // antes de jugar el user
      globalAfter: { wrUser: number; scoreUser: number }; // luego de respuesta del bot

      // Debug opcional
      debug?: {
         stmBaseline: Color;
         wrSTMBaseline?: number;
         wrUserBaseline: number;
         stmAfterUser: Color;
         wrSTMAfterUser?: number;
         wrUserAfter: number;
      };
   };
   ownership: number[]; // 361 valores [-1..1]
   state: { moves: KgVertex[] }; // historial KGS

   // Mantengo opcionales por compat
   position?: any;
   delta?: { wrSigned: number; ptsSigned: number; severity: DeltaSeverity };
}
