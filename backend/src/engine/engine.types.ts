export type Color = 'b' | 'w';

/** ===== Tipos crudos del output del analysis engine ===== */
export interface KgMoveInfo {
  move?: string;
  prior?: number;
  policy?: number;
  winrate?: number; // con tu CFG: prob. de ganar del lado al turno (SIDE-TO-MOVE)
  scoreMean?: number; // white lead (puntos a favor de blancas)
  pv?: string[]; // Principal variation (máx 5)
}

export interface KgTurnInfo {
  ownership?: number[]; // Propiedad de las celdas en el tablero
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
  moves: Array<[Color, string]>; // Registro de jugadas (Color, Jugada)
  nextColor: Color; // Siguiente turno: 'b' o 'w'
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
    /** WR usuario de la MEJOR jugada del baseline (antes de mover el usuario) [0..1] */
    bestWRPre: number;
    /** WR usuario de la posición inmediatamente después de la jugada del usuario (lado al turno: bot) [0..1] */
    wrAfterUser: number;
    /** Delta firmado: bestWRPre - wrAfterUser (positivo = error, negativo = mejor que la recomendada) */
    lossWinrate: number;

    /** Puntos (lead a favor del usuario) de la MEJOR jugada del baseline */
    bestScorePre: number;
    /** Puntos (lead a favor del usuario) tras la jugada del usuario */
    scoreAfterUser: number;
    /** Delta firmado: bestScorePre - scoreAfterUser (positivo = perdiste puntos vs la mejor) */
    lossPoints: number;

    debug?: {
      stmBaseline: Color; // usuario
      wrSTMBaseline?: number;
      wrUserBaseline: number;

      stmAfterUser: Color; // bot
      wrSTMAfterUser?: number;
      wrUserAfter: number;
    };
  };
  ownership: number[];
  state: { moves: string[] };
}
