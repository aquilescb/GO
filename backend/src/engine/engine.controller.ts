// src/engine/katago/engine.controller.ts
import { Body, Controller, Get, Post } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { KatagoService } from '../engine/katago/katago.service';
import { AnalysisConfig } from '../engine/katago/engine.analysis.config';
import type { PlayEvalV2Response } from '../engine/engine.types';
import type {
  DifficultyPreset,
  HardwareProfile,
  RuntimeOverrides,
} from '../engine/katago/runtime-config';

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

  // Ver config efectiva
  @Get('config')
  config() {
    return AnalysisConfig;
  }

  // Listar redes disponibles
  @Get('networks')
  networks() {
    const dir = AnalysisConfig.networksDir;
    const files = fs
      .readdirSync(dir)
      .filter((f) => /\.txt\.gz$/i.test(f))
      .map((f) => ({ filename: f, fullpath: path.join(dir, f) }));
    return { dir, files };
  }

  // Aplicar preset/hardware/red
  @Post('config/apply')
  apply(
    @Body()
    body: {
      preset?: DifficultyPreset;
      hardware?: HardwareProfile;
      networkFilename?: string;
    },
  ) {
    if (body.preset) AnalysisConfig.preset = body.preset;
    if (body.hardware) AnalysisConfig.hardware = body.hardware;
    if (body.networkFilename) AnalysisConfig.networkFilename = body.networkFilename;
    this.kg.applyConfigAndRestart();
    this.kg.resetSession();
    return { status: 'ok', applied: AnalysisConfig };
  }

  // Overrides (maxVisits, temperatura, threads, etc.)
  @Post('config/override')
  override(@Body() body: RuntimeOverrides) {
    AnalysisConfig.overrides = { ...(AnalysisConfig.overrides ?? {}), ...body };
    this.kg.applyConfigAndRestart();
    return { status: 'ok', overrides: AnalysisConfig.overrides };
  }
}
