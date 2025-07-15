export type Color = "black" | "white";
export type StoneColor = Color | null;

export interface Move {
  x: number;
  y: number;
  color: Color;
}

export type Board = StoneColor[][];
