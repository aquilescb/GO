import type { GroupData } from '../engine/group-analyzer';
// Tamaño fijo inicial (puede ampliarse en el futuro)
export type BoardSize = 19;

// Representación de una intersección del tablero
export type Stone = 'black' | 'white' | null;

export type Board = Stone[][]; // Matriz 19x19

// Coordenadas de una jugada
export interface Move {
  x: number;
  y: number;
  color: 'black' | 'white';
}

// Perfil del jugador para personalizar feedback
export interface PlayerProfile {
  level: 'beginner' | 'intermediate' | 'advanced';
  style?: 'aggressive' | 'defensive' | 'balanced';
  commonMistakes?: string[]; // ej. ["bad_connection", "overconcentration"]
}

// Estructura enviada al backend
export interface AnalyzeMoveInput {
  move: Move;
  board: Board;
  lastMoves: Move[];
  playerProfile: PlayerProfile;
}

// Resultado del análisis del contexto del tablero
export interface BoardContext {
  threats: string[]; 
  opportunities: string[]; 
  patternsDetected: string[]; 
  currentSituationSummary: string; 
}

// Respuesta generada por el motor
export interface ReflectionMessage {
  message: string;
  tags?: string[]; 
}

export interface EngineEvaluation {
  liberties: number;
  territoryEstimate: { black: number; white: number };
  isAtari: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  groupsInAtari?: GroupData[]; 
  overconcentrated: boolean;
  connectsGroups?: boolean;
  createsEye?: boolean;
  threatensCapture?: boolean;
}

export interface AssistantResponse {
  level: number;
  levelLabel: string;
  message: string;
  reason: string;
  evaluation: EngineEvaluation;
}
