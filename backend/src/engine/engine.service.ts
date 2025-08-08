import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { GnuGoService } from './gnugo/gnugo.service';
import { PachiService } from './pachi/pachi.service';
import { LeelaService } from './leela/leela.service';
type EngineName = 'pachi' | 'gnugo' | 'leela';

@Injectable()
export class EngineManagerService implements OnModuleDestroy {
  private currentEngine: EngineName | null = null;
  private engineType: EngineName = 'gnugo';

  constructor(
    private readonly pachiService: PachiService,
    private readonly gnugoService: GnuGoService,
    private readonly leelaService: LeelaService,
  ) {}

  startEngine(engine: EngineName): void {
    if (this.currentEngine === engine) return;
    this.stopCurrentEngine();
    this.currentEngine = engine;
    if (engine === 'pachi') {
      this.pachiService.start();
    } else if (engine === 'gnugo') {
      this.gnugoService.start();
    } else if (engine === 'leela') {
      this.leelaService.start(); // nuevo
    }
    console.log(`✅ Motor iniciado: ${engine}`);
  }

  async sendCommand(command: string): Promise<string> {
    if (this.currentEngine === 'pachi') return this.pachiService.sendCommand(command);
    if (this.currentEngine === 'gnugo') return this.gnugoService.sendCommand(command);
    if (this.currentEngine === 'leela') return this.leelaService.sendCommand(command);
    throw new Error('No hay motor activo.');
  }

  async estimateScore(): Promise<string> {
    if (this.currentEngine === 'gnugo') return await this.gnugoService.estimateScore();
    return 'N/A';
  }

  async getCaptures(): Promise<{ black: number; white: number }> {
    if (this.currentEngine === 'gnugo') return await this.gnugoService.getCaptures();
    return { black: 0, white: 0 };
  }

  stopCurrentEngine(): void {
    if (this.currentEngine === 'pachi') this.pachiService.stop();
    if (this.currentEngine === 'gnugo') this.gnugoService.stop();
    if (this.currentEngine === 'leela') this.leelaService.stop();
    this.currentEngine = null;
  }

  onModuleDestroy() {
    this.stopCurrentEngine();
  }

  getEngineName(): EngineName | null {
    return this.currentEngine;
  }

  setEngineType(type: EngineName) {
    this.engineType = type;
  }

  getEngineType() {
    return this.engineType;
  }
}
