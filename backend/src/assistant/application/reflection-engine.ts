import { BoardContext, PlayerProfile } from "../domain/types/assistant.types";
import { ResponseTemplates } from "../domain/templates/response-templates";

export class ReflectionEngine {
  generate(context: BoardContext, profile: PlayerProfile): string {
    const { threats, opportunities, patternsDetected } = context;
    const level = profile.level;

    // Amenazas
    for (const threat of threats) {
      if (threat in ResponseTemplates.threats) {
        return this.random(ResponseTemplates.threats[threat]);
      }
    }

    // Oportunidades
    for (const opportunity of opportunities) {
      if (opportunity in ResponseTemplates.opportunities) {
        return this.random(ResponseTemplates.opportunities[opportunity]);
      }
    }

    // Patrones
    for (const pattern of patternsDetected) {
      if (pattern in ResponseTemplates.patterns) {
        return this.random(ResponseTemplates.patterns[pattern]);
      }
    }

    // Respuesta por nivel del jugador
    return this.random(ResponseTemplates.genericByLevel[level] || [
      "¿Qué impacto creés que tendrá esta jugada en la posición general?",
    ]);
  }

  private random(arr: string[]): string {
    return arr[Math.floor(Math.random() * arr.length)];
  }
}
