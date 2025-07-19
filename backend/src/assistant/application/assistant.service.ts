import { Injectable } from '@nestjs/common';
import { AnalyzeMoveInput } from '../domain/types/assistant.types';
import { Analyzer } from '../domain/analyzer/analyzer';
import { GoEngine } from '../domain/engine/go-engine';
import { InterventionEngine, InterventionLevel } from './intervention-engine';

@Injectable()
export class AssistantService {
  constructor(
    private readonly analyzer: Analyzer,
    private readonly goEngine: GoEngine,
    private readonly interventionEngine: InterventionEngine,
  ) {}

  think(input: AnalyzeMoveInput): any {
    const boardContext = this.analyzer.analyze(input);
    const evaluation = this.goEngine.evaluateBoard(input.board, input.move);

    const intervention = this.interventionEngine.evaluate({
      context: boardContext,
      profile: input.playerProfile,
      evaluation,
    });

    return {
      level: intervention.level,
      levelLabel: InterventionLevel[intervention.level],
      message: intervention.message,
      reason: intervention.reason,
      evaluation,
    };
  }
}
