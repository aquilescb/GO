export type StoneColor = "black" | "white";
export interface Move {
   x: number; // 0..18
   y: number; // 0..18
   color: StoneColor;
}
export type StoneMap = Record<string, StoneColor>; // key: "x,y"
