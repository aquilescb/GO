// src/lib/types/katago.ts
export type KgVertex = string;
export type Color = "b" | "w";

export interface CandidateBlack {
   move: KgVertex;
   prior: number;
   winrateBlack: number; // 0..1
   scoreMeanBlack: number; // puntos (lead negras)
   pv: KgVertex[]; // len 5
}

export interface PlayEvalV2Response {
   MovBot: {
      botMove: KgVertex;
      candidates: CandidateBlack[];
   };
   MovUser: {
      recommendations: CandidateBlack[];
   };
   metrics: {
      bestWRPre: number;
      wrAfterUser: number;
      lossWinrate: number;
      bestScorePre: number;
      scoreAfterUser: number;
      lossPoints: number;
   };
   ownership: number[]; // 361 valores [-1..1] (posición REAL)
   state: {
      moves: KgVertex[];
   };
}
