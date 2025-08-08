import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as path from 'path';
@Injectable()
export class PachiService implements OnModuleDestroy {
  private readonly pachiPath = path.resolve(process.cwd(), 'pachi', 'pachi.exe');
  private pachi: ChildProcessWithoutNullStreams | null = null;
  private outputBuffer = '';
  private stderrBuffer = '';

  start(): void {
    if (this.pachi) return; // Ya iniciado

    this.pachi = spawn(this.pachiPath, [
      '-e',
      'uct',
      '-t',
      '=5000:10000',
      '--modern-joseki',
      'resign_threshold=0.25',
    ]);

    this.pachi.stdout.on('data', (data: Buffer) => {
      this.outputBuffer += data.toString();
    });

    this.pachi.stderr.on('data', (data: Buffer) => {
      this.handleStderrChunk(data);
    });

    this.pachi.on('exit', (code) => {
      console.log(`Pachi exited with code ${code}`);
    });
  }

  stop(): void {
    if (this.pachi) {
      this.pachi.stdin.write('quit\n');
      this.pachi.kill();
      this.pachi = null;
      console.log('🛑 Pachi detenido');
    }
  }

  private handleStderrChunk(data: Buffer) {
    const chunk = data.toString();
    this.stderrBuffer += chunk;

    if (chunk.endsWith('\n\n') || chunk.endsWith('\n')) {
      console.error(this.stderrBuffer.trim());
      this.stderrBuffer = '';
    }
  }

  async sendCommand(command: string): Promise<string> {
    if (!this.pachi) {
      throw new Error('Pachi no ha sido iniciado. Llamá a start() primero.');
    }

    return new Promise((resolve) => {
      this.outputBuffer = '';

      const onData = (data: Buffer) => {
        this.outputBuffer += data.toString();
        if (this.outputBuffer.includes('\n=') || this.outputBuffer.startsWith('=')) {
          cleanup();
          resolve(this.outputBuffer);
        }
      };

      const onError = (data: Buffer) => {
        this.outputBuffer += data.toString();
        if (this.outputBuffer.includes('\n=') || this.outputBuffer.startsWith('=')) {
          cleanup();
          resolve(this.outputBuffer);
        }
      };

      const cleanup = () => {
        this.pachi!.stdout.off('data', onData);
        this.pachi!.stderr.off('data', onError);
      };
      if (!this.pachi) {
        throw new Error('GNU Go no está iniciado');
      }
      this.pachi.stdout.on('data', onData);
      this.pachi.stderr.on('data', onError);

      this.pachi.stdin.write(`${command}\n`);
    });
  }

  async estimateScore(): Promise<string> {
    const response = await this.sendCommand('final_score');
    const scoreLine = response.split('\n').find((line) => line.trim().startsWith('=')) || '';
    return scoreLine.replace('=', '').trim();
  }

  onModuleDestroy() {
    this.stop();
  }
}
