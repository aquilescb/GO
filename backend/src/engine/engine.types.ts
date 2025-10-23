export type Color = 'b' | 'w';

/** ===== Tipos crudos del output del analysis engine ===== */
export interface KgMoveInfo {
  move?: string;
  prior?: number;
  policy?: number;
  /** Prob. de ganar del lado-al-turno en el HIJO (0..1). */
  winrate?: number;
  /** Lead a favor de blancas en el HIJO (pts). */
  scoreMean?: number;
  pv?: string[];
}

export interface KgTurnInfo {
  ownership?: number[];
}

/** Nodo tipo root que pueden devolver distintos builds */
export interface KgRootLike {
  moveInfos?: KgMoveInfo[];
  ownership?: number[];

  /** Prob. de ganar del lado-al-turno en este nodo (0..1). */
  winrate?: number;

  /** Lead a favor de BLANCAS (algunos builds: scoreLead, otros: scoreMean). */
  scoreLead?: number;
  scoreMean?: number;
}

export interface KgAnalysisRaw {
  rootInfo?: KgRootLike;
  root?: KgRootLike;
  moveInfos?: KgMoveInfo[];
  ownership?: number[];
  turns?: KgTurnInfo[];
}

/** ===== DTOs ===== */
export interface CandidateBlackDTO {
  move: string;
  prior: number;
  winrateBlack: number; // 0..1 (desde el usuario)
  scoreMeanBlack: number; // pts (desde el usuario)
  pv: string[];
}

export interface SessionData {
  moves: Array<[Color, string]>;
  nextColor: Color;
}

export interface PlayEvalV2Response {
  MovBot: {
    botMove: string;
    candidates: CandidateBlackDTO[];
  };
  MovUser: {
    recommendations: CandidateBlackDTO[];
  };
  metrics: {
    bestWRPre: number;
    wrAfterUser: number;
    lossWinrate: number;

    bestScorePre: number;
    scoreAfterUser: number;
    lossPoints: number;

    /** === Nuevos campos para frontend === */
    absLossWinrate?: number;
    absLossPoints?: number;
    isImprovement?: boolean;

    debug?: {
      stmBaseline: Color;
      wrSTMBaseline?: number;
      wrUserBaseline: number;

      stmAfterUser: Color;
      wrSTMAfterUser?: number;
      wrUserAfter: number;
    };
  };
  ownership: number[];
  state: { moves: string[] };
}
