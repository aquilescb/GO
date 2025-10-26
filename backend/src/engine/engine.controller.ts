// src/engine/katago/engine.controller.ts
import { Body, Controller, Get, Post } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { KatagoService } from '../engine/katago/katago.service';
import { AnalysisConfig } from '../engine/katago/engine.analysis.config';
import type { PlayEvalV2Response } from '../engine/engine.types';
import {
  resolveModelAbsolutePath,
  DifficultyPreset,
  HardwareProfile,
  RuntimeOverrides,
} from '../engine/katago/runtime-config';
type ResolvedModel = { path: string; format: 'bin' | 'txt' };

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
    let resolvedMain: ResolvedModel | null = null;
    let resolvedHuman: ResolvedModel | null = null;
    try {
      resolvedMain = resolveModelAbsolutePath(
        AnalysisConfig.networksDir,
        AnalysisConfig.networkFilename,
      );
    } catch {}
    try {
      if (AnalysisConfig.humanModelFilename) {
        resolvedHuman = resolveModelAbsolutePath(
          AnalysisConfig.networksDir,
          AnalysisConfig.humanModelFilename,
        );
      }
    } catch {}

    return { ...AnalysisConfig, resolvedModel: resolvedMain, resolvedHumanModel: resolvedHuman };
  }
  // Listar redes disponibles
  @Get('networks')
  networks() {
    const dir = AnalysisConfig.networksDir;
    const entries = fs.readdirSync(dir);

    const isModel = (f: string) => /\.((bin|txt)\.gz)$/i.test(f);
    const toMeta = (f: string) => {
      const fullpath = path.join(dir, f);
      const st = fs.statSync(fullpath);
      const lower = f.toLowerCase();

      // parse rápido de bXXcYYY y flags
      const m = lower.match(/b(\d+)c(\d+)/);
      const blocks = m ? Number(m[1]) : undefined;
      const channels = m ? Number(m[2]) : undefined;
      const nbt = /nbt/.test(lower);
      const isHuman = /human/.test(lower);

      const format: 'bin' | 'txt' = lower.endsWith('.bin.gz') ? 'bin' : 'txt';

      // “baseName” sin extensión para que el front pueda mandar solo eso si quiere
      const baseName = f.replace(/\.((bin|txt)\.gz)$/i, '');

      return {
        filename: f,
        baseName,
        fullpath,
        format, // 'bin' | 'txt'
        sizeBytes: st.size,
        mtimeMs: st.mtimeMs,
        blocks,
        channels,
        nbt,
        isHuman,
      };
    };

    const files = entries.filter(isModel).map(toMeta);

    return { dir, files };
  }

  // Aplicar preset/hardware/red
  @Post('config/apply')
  apply(
    @Body()
    body: {
      preset?: DifficultyPreset;
      hardware?: HardwareProfile;
      networkFilename?: string; // main (baseName o filename)
      humanModelFilename?: string; // humano (baseName o filename)
      humanSLProfile?: string; // ej: rank_10k, rank_3d, proyear_2016
    },
  ) {
    if (body.preset) AnalysisConfig.preset = body.preset;
    if (body.hardware) AnalysisConfig.hardware = body.hardware;

    if (body.networkFilename) {
      resolveModelAbsolutePath(AnalysisConfig.networksDir, body.networkFilename); // valida
      AnalysisConfig.networkFilename = body.networkFilename;
    }

    if (typeof body.humanModelFilename === 'string') {
      // vacío => desactivar humano
      if (body.humanModelFilename.trim() === '') {
        AnalysisConfig.humanModelFilename = undefined as any;
      } else {
        resolveModelAbsolutePath(AnalysisConfig.networksDir, body.humanModelFilename); // valida
        AnalysisConfig.humanModelFilename = body.humanModelFilename;
      }
    }

    if (body.humanSLProfile) {
      AnalysisConfig.humanSLProfile = body.humanSLProfile;
    }

    this.kg.applyConfigAndRestart();
    this.kg.resetSession();

    const resolvedMain = resolveModelAbsolutePath(
      AnalysisConfig.networksDir,
      AnalysisConfig.networkFilename,
    );

    let resolvedHuman: ResolvedModel | null = null;
    try {
      if (AnalysisConfig.humanModelFilename) {
        resolvedHuman = resolveModelAbsolutePath(
          AnalysisConfig.networksDir,
          AnalysisConfig.humanModelFilename,
        );
      }
    } catch {}

    return {
      status: 'ok',
      applied: AnalysisConfig,
      resolvedModel: resolvedMain,
      resolvedHumanModel: resolvedHuman,
    };
  }
  // Overrides (maxVisits, temperatura, threads, etc.)
  @Post('config/override')
  override(@Body() body: RuntimeOverrides) {
    AnalysisConfig.overrides = { ...(AnalysisConfig.overrides ?? {}), ...body };
    this.kg.applyConfigAndRestart();
    return { status: 'ok', overrides: AnalysisConfig.overrides };
  }
}
