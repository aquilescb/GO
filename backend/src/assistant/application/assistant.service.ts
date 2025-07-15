import { Injectable } from "@nestjs/common";
import { AnalyzeMoveInput, ReflectionMessage } from "../domain/types/assistant.types";
import { Analyzer } from "../domain/analyzer/analyzer";
import { ReflectionEngine } from "../application/reflection-engine";
//Recibe jugada y contexto, devuelve respuesta
@Injectable()
export class AssistantService {
  private analyzer = new Analyzer();
  private reflectionEngine = new ReflectionEngine();

  think(input: AnalyzeMoveInput): ReflectionMessage {
    // 1. Analizar el tablero y jugada
    const boardContext = this.analyzer.analyze(input);

    // 2. Generar respuesta reflexiva basada en contexto + perfil del jugador
    const message = this.reflectionEngine.generate(boardContext, input.playerProfile);

    // 3. Devolver mensaje
    return { message };
  }
}
