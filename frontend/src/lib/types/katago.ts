// src/lib/types/katago.ts

export type KgVertex = string;
export type Color = "b" | "w";

/** Candidata (ya convertida a la perspectiva del color objetivo indicado en cada bloque) */
export interface CandidateBlack {
   move: KgVertex;
   prior: number;
   /** Probabilidad de ganar del color objetivo (0..1) */
   winrateBlack: number;
   /** Puntos a favor del color objetivo (con signo, desde ese color) */
   scoreMeanBlack: number;
   /** Principal variation (máx 5) */
   pv: KgVertex[];
}

/** “Quién va ganando ahora” en la posición real (post-bot) */
export interface PositionNow {
   /** 'b' | 'w' | 'even' según lead/signo */
   leader: Color | "even";
   /** Margen absoluto en puntos (>= 0) */
   leadPointsAbs: number;
   /** Margen con signo desde BLANCAS (>0 gana W, <0 gana B) */
   leadFromWhiteSigned: number;
   /** Winrates en el root actual (convertidos a cada color) */
   winrate: {
      black: number; // 0..1
      white: number; // 0..1
   };
   /** A quién le toca (en tu flujo, vuelve al usuario) */
   toMove: Color;
}

/** Etiquetas de severidad por Delta de winrate */
export type DeltaSeverity = "perfect" | "inaccuracy" | "mistake" | "blunder";

export interface PlayEvalV2Response {
   MovBot: {
      botMove: KgVertex;
      candidates: CandidateBlack[]; // top-3
   };
   MovUser: {
      recommendations: CandidateBlack[]; // top-3
   };
   metrics: {
      /** [0..1] WR del usuario si hubiera jugado la MEJOR del baseline */
      bestWRPre: number;
      /** [0..1] WR del usuario en el ROOT real tras su jugada (turno del bot) */
      wrAfterUser: number;
      /** ABS(bestWRPre - wrAfterUser) */
      lossWinrate: number;

      /** Pts (con signo) del usuario si hubiera jugado la MEJOR del baseline */
      bestScorePre: number;
      /** Pts (con signo) del usuario en el ROOT real tras su jugada */
      scoreAfterUser: number;
      /** ABS(bestScorePre - scoreAfterUser) */
      lossPoints: number;

      /** NUEVO: deltas con signo + severidad (opcional para compat) */
      delta?: {
         /** > 0 empeoraste; < 0 mejoraste (en WR) */
         wrSigned: number;
         /** > 0 empeoraste; < 0 mejoraste (en puntos) */
         ptsSigned: number;
         /** Clasificación por umbrales de WR */
         severity: DeltaSeverity;
      };

      /** NUEVO: datos de depuración (opcional) */
      debug?: {
         stmBaseline: Color; // quién estaba al turno en baseline (usuario)
         wrSTMBaseline?: number; // WR side-to-move (engine) baseline
         wrUserBaseline: number; // baseline convertido a usuario

         stmAfterUser: Color; // quién está al turno tras la jugada del usuario (bot)
         wrSTMAfterUser?: number; // WR side-to-move (engine) post-jugada
         wrUserAfter: number; // post-jugada convertido a usuario

         whiteLeadAfterRoot?: number; // lead a favor de blancas (engine) en root
         userLeadAfterRoot?: number; // lead convertido a usuario (con signo)

         userMoveKGS?: KgVertex; // jugada del usuario normalizada
         userMoveRankBaseline?: number | null; // rank 1-based en baseline (null si no aparece)

         baselineTop3?: Array<{
            move: KgVertex;
            wrUser: number; // 0..1
            leadUser: number; // puntos con signo desde usuario
         }>;
      };
   };

   /** Ownership crudo [-1..1] (361 valores) de la posición REAL (post-bot) */
   ownership: number[];

   state: {
      /** Historial en notación KGS (ej: ["D4","Q16",...]) */
      moves: KgVertex[];
   };

   /** NUEVO: estado actual de la partida (post-bot). Opcional para compat hacia atrás. */
   position?: PositionNow;
}
