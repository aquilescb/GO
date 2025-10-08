// src/engine/katago/engine.controller.ts
import { Body, Controller, Get, Post } from '@nestjs/common';
import { KatagoService } from '../engine/katago/katago.service';
import { AnalysisConfig } from '../engine/katago/engine.analysis.config';
import type { PlayEvalV2Response } from '../engine/engine.types';
import type { DifficultyPreset, HardwareProfile } from '../engine/katago/runtime-config';

@Controller('game')
export class EngineController {
  constructor(private readonly kg: KatagoService) {}

  @Post('start')
  start(): { status: 'ok'; message: string } {
    this.kg.warmup();
    this.kg.resetSession();
    return { status: 'ok', message: 'engine warmed & session reset' };
  }

  @Post('shutdown')
  shutdown(): { status: 'ok' } {
    this.kg.onModuleDestroy();
    return { status: 'ok' };
  }

  @Post('play-eval')
  async playEval(@Body() body: { move: string }): Promise<PlayEvalV2Response> {
    return this.kg.playEvalV2((body?.move ?? '').toUpperCase());
  }

  // ==== Nuevo: ver config efectiva (para UI interna / docs)
  @Get('config')
  config() {
    return AnalysisConfig;
  }

  // ==== Nuevo: aplicar preset/hardware/red y reiniciar
  @Post('config/apply')
  apply(
    @Body()
    body: {
      preset?: DifficultyPreset;
      hardware?: HardwareProfile;
      networkFilename?: string;
    },
  ) {
    if (body.preset) (AnalysisConfig as any).preset = body.preset;
    if (body.hardware) (AnalysisConfig as any).hardware = body.hardware;
    if (body.networkFilename) (AnalysisConfig as any).networkFilename = body.networkFilename;

    this.kg.applyConfigAndRestart();
    this.kg.resetSession();
    return { status: 'ok', applied: AnalysisConfig };
  }
}
