import { Module } from '@nestjs/common';
import { AssistantService } from '../application/assistant.service';
import { AssistantController } from '../infra/assistant.controller';
import { Analyzer } from '../domain/analyzer/analyzer';
import { InterventionEngine } from '../application/intervention-engine';
import { GoEngine } from '../domain/engine/go-engine';

@Module({
  controllers: [AssistantController],
  providers: [AssistantService, Analyzer, InterventionEngine, GoEngine],
})
export class AssistantModule {}
