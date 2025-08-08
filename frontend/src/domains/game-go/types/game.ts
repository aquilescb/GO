export interface Move {
  x: number;         // Columna, de 0 a 18
  y: number;         // Fila, de 0 a 18
  color: 'black' | 'white'; // Color de la piedra
}

export type EngineType = 'pachi' | 'gnugo' | 'leela';

export interface IGoEngine {
  type: EngineType;
  start(): Promise<void>;
  play(color: 'black'|'white', coord: string): Promise<string>; // devuelve coord del bot
  reset(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
}

export interface GameResponse {
  botMove: string;
  score: string | null;
  details: {
    captures: {
      black: number;
      white: number;
    };
  };
}

export type StoneColor = 'black' | 'white';
export type StoneMap = Record<string, StoneColor>;