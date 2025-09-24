export type KgVertex = string; // "A1".."T19" sin "I"; admite "PASS"

export interface CandidateMove {
   move: KgVertex;
   order: number; // 1..3
   prior: number; // [0..1]
   winrate: number; // [0..1]
   scoreMean: number; // puntos
}
export interface AnalysisPayload {
   winrate: number;
   turnNumber: number;
   scoreMean: number;
   pv: KgVertex[];
   ownership?: number[]; // -1..1, len 361
   candidates: CandidateMove[]; // top <=3
}

export interface PlayResponse {
   botMove: KgVertex;
   analysis: AnalysisPayload;
}

export interface StartResponse {
   status: "ok";
   message: string;
}

export interface EngineError {
   error: string;
   message?: string;
}
