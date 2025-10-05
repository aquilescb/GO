// src/engine/katago/engine.controller.ts
import { Body, Controller, Get, Post } from '@nestjs/common';
import { KatagoService } from '../engine/katago/katago.service';
import type { PlayEvalV2Response } from '../engine/engine.types';

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
    const mv = (body?.move ?? '').toUpperCase();
    return this.kg.playEvalV2(mv);
  }

  // si querés un snapshot del estado actual:
  @Get('state')
  state(): { moves: string[] } {
    // muy simple: se podría exponer otro método si lo necesitás
    return { moves: [] };
  }
}
