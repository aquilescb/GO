export type Color = "black" | "white";
export type StoneColor = Color | null;

export interface Move {
  x: number;
  y: number;
  color: Color;
}
export type Board = StoneColor[][];

export interface EngineEvaluation {
  liberties: number;
  isAtari: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  territoryEstimate: { black: number; white: number };
}

export interface AssistantResponse {
  level: number;
  levelLabel: string;
  message: string;
  reason: string;
  evaluation: EngineEvaluation;
}
