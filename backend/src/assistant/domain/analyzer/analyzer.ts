import { AnalyzeMoveInput, BoardContext, Move, Stone } from "../types/assistant.types";
// Este archivo contiene la lógica de análisis del tablero y jugadas
// Se encarga de detectar amenazas, oportunidades y patrones en el contexto del juego
// Esta clase es el corazón del motor de análisis del asistente
export class Analyzer {
  analyze(input: AnalyzeMoveInput): BoardContext {
    const { board, move, lastMoves } = input;
    const threats: string[] = [];
    const opportunities: string[] = [];
    const patternsDetected: string[] = [];

    // Ejemplo: ¿el grupo donde se jugó está aislado?
    if (this.isIsolatedGroup(board, move)) {
      threats.push("group_at_risk");
      patternsDetected.push("isolated_group");
    }

    // Ejemplo: ¿la jugada conecta con otro grupo?
    if (this.isConnectionMove(board, move)) {
      opportunities.push("connect_group");
    }

    // Ejemplo: ¿jugada en misma zona que antes?
    if (this.isOverconcentrated(lastMoves, move)) {
      patternsDetected.push("overconcentration");
    }

    const summary = this.generateSummary(threats, opportunities, patternsDetected);

    return {
      threats,
      opportunities,
      patternsDetected,
      currentSituationSummary: summary,
    };
  }

  private isIsolatedGroup(board: Stone[][], move: Move): boolean {
    // Simplificación: si no hay piedras del mismo color en las 4 direcciones
    const { x, y, color } = move;
    const neighbors = this.getNeighbors(board, x, y);
    return !neighbors.some(stone => stone === color);
  }

  private isConnectionMove(board: Stone[][], move: Move): boolean {
    const { x, y, color } = move;
    const neighbors = this.getNeighbors(board, x, y);
    const sameColor = neighbors.filter(stone => stone === color).length;
    return sameColor >= 2; // Conectó con al menos dos
  }

  private isOverconcentrated(lastMoves: Move[], move: Move): boolean {
    const threshold = 3;
    const countNear = lastMoves.filter(m => 
      Math.abs(m.x - move.x) <= 2 && Math.abs(m.y - move.y) <= 2
    ).length;
    return countNear >= threshold;
  }

  private getNeighbors(board: Stone[][], x: number, y: number): (Stone | undefined)[] {
    const neighbors = [
      board[y - 1]?.[x], // arriba
      board[y + 1]?.[x], // abajo
      board[y]?.[x - 1], // izquierda
      board[y]?.[x + 1], // derecha
    ];
    return neighbors;
  }

  private generateSummary(
    threats: string[],
    opportunities: string[],
    patterns: string[]
  ): string {
    const t = threats.length ? `Amenazas: ${threats.join(", ")}` : "Sin amenazas detectadas.";
    const o = opportunities.length ? `Oportunidades: ${opportunities.join(", ")}` : "Sin oportunidades claras.";
    const p = patterns.length ? `Patrones: ${patterns.join(", ")}` : "";
    return `${t} ${o} ${p}`;
  }
}
