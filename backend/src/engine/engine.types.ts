// src/engine/engine.types.ts

export type Color = 'b' | 'w';

/** ===== Tipos crudos del output del analysis engine ===== */
export interface KgMoveInfo {
  move?: string;
  prior?: number;
  policy?: number;
  winrate?: number; // con tu CFG: prob. de ganar del lado al turno (SIDE-TO-MOVE)
  scoreMean?: number; // white lead (puntos a favor de blancas)
  pv?: string[];
}
export interface KgTurnInfo {
  ownership?: number[];
}
export interface KgAnalysisRaw {
  rootInfo?: { moveInfos?: KgMoveInfo[]; ownership?: number[] };
  root?: { moveInfos?: KgMoveInfo[]; ownership?: number[] };
  moveInfos?: KgMoveInfo[];
  ownership?: number[];
  turns?: KgTurnInfo[];
}

/** ===== DTOs ===== */
export interface CandidateBlackDTO {
  move: string;
  prior: number;
  winrateBlack: number; // prob. de ganar NEGRAS tras ese movimiento (0..1)
  scoreMeanBlack: number; // puntos a favor de NEGRAS
  pv: string[]; // largo 5
}

export interface SessionData {
  moves: Array<[Color, string]>;
  nextColor: Color;
}

export interface PlayEvalV2Response {
  MovBot: {
    botMove: string;
    candidates: CandidateBlackDTO[]; // top-3
  };
  MovUser: {
    recommendations: CandidateBlackDTO[]; // top-3
  };
  metrics: {
    bestWRPre: number; // [0..1] WR usuario de la MEJOR del baseline
    wrAfterUser: number; // [0..1] WR usuario tras la jugada del usuario (turno del bot)
    lossWinrate: number; // ABS(bestWRPre - wrAfterUser)
    bestScorePre: number; // puntos usuario de la MEJOR del baseline
    scoreAfterUser: number; // puntos usuario tras la jugada del usuario
    lossPoints: number; // ABS(bestScorePre - scoreAfterUser)
    debug?: {
      stmBaseline: Color; // quién estaba al turno en baseline (usuario)
      wrSTMBaseline?: number; // WR side-to-move reportado por KataGo (baseline)
      wrUserBaseline: number; // WR baseline convertido a usuario

      stmAfterUser: Color; // quién está al turno tras la jugada del usuario (bot)
      wrSTMAfterUser?: number; // WR side-to-move reportado por KataGo (after user)
      wrUserAfter: number; // WR after user convertido a usuario
    };
  };
  ownership: number[]; // ÚNICO ownership crudo [-1..1] (361 vals) POSICIÓN REAL (post-bot)
  state: {
    moves: string[]; // historial KGS
  };
}
