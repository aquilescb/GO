// src/engine/engine.module.ts
import { Module } from '@nestjs/common';
import { EngineManagerService } from './engine.service';
import { PachiService } from './pachi/pachi.service';
import { GnuGoService } from './gnugo/gnugo.service';
import { LeelaService } from './leela/leela.service';
@Module({
  providers: [EngineManagerService, PachiService, GnuGoService, LeelaService],
  exports: [EngineManagerService],
})
export class EngineModule {}
