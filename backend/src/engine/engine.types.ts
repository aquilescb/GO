/** ======== Tipos base ======== */

/** Color del jugador: 'b' = negras, 'w' = blancas. */
export type Color = 'b' | 'w';

/** Punto de tablero en formato KGS (ej. 'D4', 'PASS', 'Q16'). */
export type MoveCoord = string;

/** ======== Tipos crudos del motor de análisis (analysis engine) ======== */

/** Información de una jugada candidata (child del root). */
export interface KgMoveInfo {
  /** Movimiento sugerido (ej. 'Q16', 'D4', 'PASS'). */
  move?: MoveCoord;

  /** Prioridad de la política (red prior). */
  prior?: number;

  /** Política normalizada (a veces duplicado de prior). */
  policy?: number;

  /** Probabilidad de ganar del lado-al-turno en el hijo (0..1). */
  winrate?: number;

  /** Lead promedio a favor de BLANCAS en el hijo (pts). */
  scoreMean?: number;

  /** Secuencia de jugadas sugerida (Principal Variation). */
  pv?: MoveCoord[];
}

/** Propiedad de influencia (ownership) por intersección del tablero. */
export interface KgTurnInfo {
  /** Vector flatten 19×19 de ownership (-1..1, positivo = blanco). */
  ownership?: number[];
}

/** Nodo raíz o rootInfo (depende del build). */
export interface KgRootLike {
  moveInfos?: KgMoveInfo[];
  ownership?: number[];

  /** Probabilidad de ganar del lado-al-turno (0..1). */
  winrate?: number;

  /** Lead a favor de BLANCAS (puede venir como scoreLead o scoreMean). */
  scoreLead?: number;
  scoreMean?: number;
}

/** Estructura cruda que KataGo devuelve por análisis. */
export interface KgAnalysisRaw {
  rootInfo?: KgRootLike;
  root?: KgRootLike;
  moveInfos?: KgMoveInfo[];
  ownership?: number[];
  turns?: KgTurnInfo[];

  /** Flag que aparece durante búsqueda continua (stream). */
  isDuringSearch?: boolean;

  /** Identificador correlativo (interno del engine). */
  id?: string;

  /** En caso de error textual desde KataGo. */
  error?: string;
}

/** ======== DTOs del backend ======== */

/** Jugada candidata evaluada desde la perspectiva del usuario (BLACK). */
export interface CandidateBlackDTO {
  /** Movimiento en formato KGS (ej. 'D4'). */
  move: MoveCoord;

  /** Prioridad o probabilidad de política. */
  prior: number;

  /** Winrate desde la perspectiva del usuario (0..1). */
  winrateBlack: number;

  /** Lead desde la perspectiva del usuario (pts). */
  scoreMeanBlack: number;

  /** Secuencia PV corta (hasta 5 jugadas aprox.). */
  pv: MoveCoord[];
}

/** Estado interno de la sesión actual del motor. */
export interface SessionData {
  /** Historial de jugadas (color, movimiento). */
  moves: Array<[Color, MoveCoord]>;

  /** Próximo color al turno. */
  nextColor: Color;
}

/** ======== Respuesta enriquecida del backend (v2) ======== */

export interface PlayEvalV2Response {
  MovBot: {
    /** Jugada elegida por el bot tras analizar la respuesta del usuario. */
    botMove: MoveCoord;
    /** Mejores candidatas para el bot. */
    candidates: CandidateBlackDTO[];
  };

  MovUser: {
    /** Recomendaciones o mejores jugadas para el usuario. */
    recommendations: CandidateBlackDTO[];
  };

  metrics: {
    /** Winrate de la mejor jugada antes del movimiento del usuario. */
    bestWRPre: number;
    /** Winrate del movimiento jugado por el usuario. */
    wrAfterUser: number;
    /** Pérdida (delta) en winrate. */
    lossWinrate: number;

    /** Score/lead de la mejor jugada antes del usuario. */
    bestScorePre: number;
    /** Score/lead de la jugada real del usuario. */
    scoreAfterUser: number;
    /** Diferencia en puntos (Δscore). */
    lossPoints: number;

    /** === Métricas derivadas para frontend === */
    /** Valor absoluto de la pérdida de winrate. */
    absLossWinrate?: number;
    /** Valor absoluto de la pérdida de puntos. */
    absLossPoints?: number;
    /** Si la jugada fue una mejora (loss < 0). */
    isImprovement?: boolean;

    /** Datos extra de depuración o trazabilidad. */
    debug?: {
      /** Lado al turno en el baseline previo. */
      stmBaseline: Color;
      /** Winrate nativo (side-to-move) en baseline. */
      wrSTMBaseline?: number;
      /** Winrate ya convertido desde el usuario en baseline. */
      wrUserBaseline: number;

      /** Lado al turno después de la jugada del usuario. */
      stmAfterUser: Color;
      /** Winrate nativo (side-to-move) post jugada. */
      wrSTMAfterUser?: number;
      /** Winrate desde la perspectiva del usuario post jugada. */
      wrUserAfter: number;
    };
  };

  /** Ownership flatten (puede estar vacío si se omite). */
  ownership: number[];

  /** Estado actual del tablero (historial plano). */
  state: {
    moves: MoveCoord[];
  };
}
