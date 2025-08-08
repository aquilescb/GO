import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as path from 'path';

@Injectable()
export class GnuGoService implements OnModuleDestroy {
  private gnugo: ChildProcessWithoutNullStreams | null = null;
  private commandQueue: { command: string; resolve: (value: string) => void }[] = [];
  private isProcessing = false;
  private outputBuffer = '';

  start(): void {
    if (this.gnugo) return;
    const gnugoPath = path.join(process.cwd(), 'gnugo', 'interface', 'gnugo.exe');
    this.gnugo = spawn(gnugoPath, ['--mode', 'gtp']);

    this.gnugo.stdout.on('data', (data: Buffer) => this.handleResponse(data.toString()));
    this.gnugo.stderr.on('data', (data: Buffer) =>
      console.error('[GNU Go ERROR]', data.toString()),
    );
    console.log('🚀 GNU Go iniciado');
  }

  private handleResponse(data: string) {
    this.outputBuffer += data;

    // Muchos motores terminan la respuesta con doble \n
    const responses = this.outputBuffer.split('\n\n');

    if (responses.length > 1) {
      const [completeResponse, ...rest] = responses;
      const { resolve } = this.commandQueue.shift()!;
      const lines = completeResponse.split('\n').map((line) => line.trim());
      const equalLine = lines.find((line) => line.startsWith('='));

      const raw = equalLine?.slice(1).trim() || '';
      resolve(raw);

      this.outputBuffer = rest.join('\n\n');
      this.isProcessing = false;
      this.processNext();
    }
  }

  private processNext() {
    if (this.isProcessing || this.commandQueue.length === 0 || !this.gnugo) return;
    const { command } = this.commandQueue[0];
    this.isProcessing = true;
    console.log(`➡️ [GnuGo Command Sent] ${command}`);

    setTimeout(() => {
      this.gnugo!.stdin.write(command + '\n');
    }, 50); // delay leve para evitar saturación
  }

  async sendCommand(command: string): Promise<string> {
    if (!this.gnugo) throw new Error('GNU Go no ha sido iniciado.');

    return new Promise((resolve) => {
      this.commandQueue.push({ command, resolve });
      this.processNext();
    });
  }

  async estimateScore(): Promise<string> {
    const response = await this.sendCommand('estimate_score');
    return response.replace('=', '').trim();
  }

  async getCaptures(): Promise<{ black: number; white: number }> {
    const b = await this.sendCommand('captures black');
    const w = await this.sendCommand('captures white');
    return {
      black: parseInt(b.replace('=', '').trim()) || 0,
      white: parseInt(w.replace('=', '').trim()) || 0,
    };
  }

  stop(): void {
    if (this.gnugo) {
      this.gnugo.kill();
      this.gnugo = null;
      console.log('🛑 GNU Go detenido');
    }
  }

  onModuleDestroy() {
    this.stop();
  }
}
