import { BoardContext, PlayerProfile, EngineEvaluation } from '../domain/types/assistant.types';
import { generateSocraticQuestion, generateAnalogy, generateDrillExercise } from '../domain/templates/response-templates';

// Define los niveles de intervención
// 1: Preventivo, 2: Correctivo, 3: Drill
export enum InterventionLevel {
    PREVENTIVE = 1,
    CORRECTIVE = 2,
    DRILL = 3,
}

export interface InterventionResult {
    level: InterventionLevel;
    message: string;
    reason: string;
}

interface EvaluateParams {
    context: BoardContext;
    profile: PlayerProfile;
    evaluation?: EngineEvaluation;
}

export class InterventionEngine {
    private consecutiveMistakes = 0;

    evaluate({ context, profile, evaluation }: EvaluateParams): InterventionResult {
        const hasCriticalIssue = context.threats.some(threat =>
        ['group_at_risk', 'lack_of_connection', 'dead_shape'].includes(threat)
        );

        const hasCommonMistake = context.patternsDetected.some(pattern =>
        profile.commonMistakes?.includes(pattern)
        );

        const isOverconcentrated = evaluation?.overconcentrated === true;

        // Nivel 3 - Drill: muchos errores acumulados
        if (hasCriticalIssue) {
            this.consecutiveMistakes += 1;
        } else {
            this.consecutiveMistakes = 0;
        }

        if (this.consecutiveMistakes >= 3) {
            return {
                level: InterventionLevel.DRILL,
                message: generateDrillExercise(context, profile),
                reason: 'Se detectaron 3 o más errores críticos consecutivos',
            };
        }

        // Nivel 2 - Correctivo
        if (hasCriticalIssue || hasCommonMistake || isOverconcentrated) {
            return {
                level: InterventionLevel.CORRECTIVE,
                message: generateAnalogy(context, profile,evaluation),
                reason: 'Se detectó un error crítico o patrón frecuente del jugador',
            };
            }

        // Nivel 1 - Preventivo
        return {
            level: InterventionLevel.PREVENTIVE,
            message: generateSocraticQuestion(context, profile, evaluation),
            reason: 'No se detectaron errores — intervención preventiva',
            };
        

        }
}
