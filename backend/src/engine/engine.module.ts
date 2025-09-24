import { Module } from '@nestjs/common';
import { GameController } from './engine.controller';
import { KatagoService } from './katago/katago.service';

@Module({
  controllers: [GameController],
  providers: [KatagoService],
  exports: [KatagoService],
})
export class EngineModule {}
