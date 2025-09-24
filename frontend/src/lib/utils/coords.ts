const LETTERS = "ABCDEFGHJKLMNOPQRST";

/**
 * Convierte una coordenada KGS ("D4") a {x,y}.
 * x,y base 0: (0,0) = esquina superior izquierda del tablero.
 */
export function coordToXY(coord: string): { x: number; y: number } {
   const col = LETTERS.indexOf(coord[0]);
   const row = 19 - parseInt(coord.slice(1), 10);
   return { x: col, y: row };
}

/**
 * Convierte (x,y) base 0 a coordenada KGS ("D4").
 * Ejemplo: (3,15) -> "D4".
 */
export function xyToCoord(x: number, y: number): string {
   const letter = LETTERS[x];
   const number = 19 - y;
   return `${letter}${number}`;
}

export function truncTo(n: number, decimals: number): number {
   const p = 10 ** decimals;
   return Math.trunc(n * p) / p;
}

// 0.405191513 -> "40.51" (dos decimales, trunc)
export function formatPercent2(fraction: number): string {
   return truncTo(fraction * 100, 2).toFixed(2);
}

// -1.35058767 -> "-1.350" (tres decimales, trunc)
export function formatFixed3(n: number): string {
   return truncTo(n, 3).toFixed(3);
}
