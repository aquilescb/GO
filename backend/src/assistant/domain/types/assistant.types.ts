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
  threats: string[]; // ej. ["group_at_risk", "lack_of_connection"]
  opportunities: string[]; // ej. ["potential_attack", "secure_territory"]
  patternsDetected: string[]; // ej. ["classic_shape", "overconcentration"]
  currentSituationSummary: string; // breve resumen
}

// Respuesta generada por el motor
export interface ReflectionMessage {
  message: string;
  tags?: string[]; // opcional: etiquetas tipo ["invasion", "connection"]
}
