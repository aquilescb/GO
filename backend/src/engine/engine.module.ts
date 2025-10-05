import { Module } from '@nestjs/common';
import { EngineController } from './engine.controller';
import { KatagoService } from './katago/katago.service';

@Module({
  controllers: [EngineController],
  providers: [KatagoService],
  exports: [KatagoService],
})
export class EngineModule {}
