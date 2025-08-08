// src/engine/leela/leela.service.ts
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as path from 'path';

@Injectable()
export class LeelaService implements OnModuleDestroy {
  private process: ChildProcessWithoutNullStreams;

  start() {
    //Agarra los 2 archivos necesarios para iniciar LeelaZ y weights
    const enginePath = path.join(__dirname, '../../../leelaz/leelaz.exe');
    const weightsPath = path.join(__dirname, '../../../leelaz/weights.txt.gz');
    //--noponder es para evitar que LeelaZ piense en jugadas futuras mientras juega el Usuario
    //--gtp es para iniciar en modo GTP (Go Text Protocol)
    //--weights es para especificar el archivo de pesos que se utilizara
    this.process = spawn(enginePath, [
      '--gtp',
      '--weights',
      weightsPath,
      '--noponder',
      '--visits',
      '800',
    ]);

    this.process.stderr.on('data', (data: Buffer) => {
      console.error('LeelaZ stderr:', data.toString());
    });

    this.process.stdout.on('data', (data: Buffer) => {
      console.log('LeelaZ stdout:', data.toString());
    });

    this.process.stdin.write('boardsize 19\n');
    this.process.stdin.write('clear_board\n');
  }

  async sendCommand(command: string): Promise<string> {
    return new Promise((resolve) => {
      const chunks: string[] = [];
      const listener = (data: Buffer) => {
        const text = data.toString();
        chunks.push(text);
        if (text.includes('=') || text.includes('?')) {
          this.process.stdout.removeListener('data', listener);
          resolve(chunks.join('').trim());
        }
      };
      this.process.stdout.on('data', listener);
      this.process.stdin.write(`${command}\n`);
    });
  }
  stop(): void {
    if (this.process) {
      this.process.kill();
      console.log('🛑 LeelaZero detenido');
    }
  }
  onModuleDestroy() {
    this.stop();
  }
}
