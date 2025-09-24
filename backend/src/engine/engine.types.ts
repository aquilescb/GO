// src/engine/engine.types.ts
export type Color = 'b' | 'w';

export interface PlayRequestDTO {
  move: string; // ej "b2" o "D4" (KGS, sin "I")
}

export interface CandidateDTO {
  move: string;
  order: number; // 1..n
  prior: number; // policy prior (0..1)
  winrate: number; // 0..1
  scoreMean: number;
}

export interface AnalysisDTO {
  scoreMean: number;
  winrate: number;
  pv: string[];
  ownership: number[]; // 361 vals en [-1,1] para 19x19
  candidates: CandidateDTO[];
}

export interface PlayResponseDTO {
  botMove: string;
  analysis: AnalysisDTO;
}

export interface SessionData {
  moves: Array<[Color, string]>; // [['b','D4'],['w','Q16'],...], KGS
  nextColor: Color;
}
