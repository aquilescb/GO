export type Color = "black" | "white";
export type StoneColor = Color | null;

export interface Move {
    x: number;
    y: number;
    color: Color;
}

export type Board = StoneColor[][];

export type Reflexion = {
    tipo: "estratégica" | "defensiva" | "ofensiva" | "táctica";
    mensaje: string;
};

export type JugadaConTurno = Move & { turno: number };