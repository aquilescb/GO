import { Controller, Post, Body, BadRequestException, Logger } from '@nestjs/common';
import { EngineManagerService } from './engine.service';

function extractBotMoveAndInfo(response: string) {
  let botMove: string | null = null;
  const matchEq = response.match(/= ((?:[A-T][0-9]{1,2})|pass|resign)/i);
  if (matchEq) {
    botMove = matchEq[1];
  }
  if (!botMove && /^[A-T][0-9]{1,2}$/i.test(response.trim())) {
    botMove = response.trim();
  }
  return { botMove };
}

@Controller('game')
export class GameController {
  private readonly logger = new Logger(GameController.name);

  constructor(private readonly engineManager: EngineManagerService) {}

  @Post('start')
  async startGame(@Body() body: { engine: 'pachi' | 'gnugo' | 'leela' }) {
    const { engine } = body;
    if (!engine || !['pachi', 'leela', 'gnugo'].includes(engine)) {
      throw new BadRequestException('Engine inválido.');
    }
    if (this.engineManager.getEngineName() === engine) {
      return { status: 'ok', message: `El motor ${engine} ya estaba iniciado.` };
    }
    this.engineManager.startEngine(engine);
    if (engine === 'gnugo') {
      await this.engineManager.sendCommand('level 10');
    }
    await this.engineManager.sendCommand('boardsize 19');
    await this.engineManager.sendCommand('clear_board');
    return { status: 'ok', message: `Partida iniciada con ${engine}` };
  }

  @Post('play')
  async playMove(@Body() body: { color: 'black' | 'white'; move: string }) {
    const { color, move } = body;
    if (!color || !move) throw new BadRequestException('Faltan campos.');
    const engine = this.engineManager.getEngineType();
    if (!engine) throw new BadRequestException('No hay motor activo.');

    await this.engineManager.sendCommand(`play ${color} ${move}`);
    const opponentColor = color === 'black' ? 'white' : 'black';
    const response = await this.robustSendCommand(`genmove ${opponentColor}`);
    const parsed = extractBotMoveAndInfo(response);

    let score: string | null = null;
    let captures = { black: 0, white: 0 };

    if (this.engineManager.getEngineName() === 'gnugo') {
      try {
        score = await this.engineManager.estimateScore();
        captures = await this.engineManager.getCaptures();
      } catch (err) {
        this.logger.warn(`No se pudo obtener score o capturas: ${err}`);
      }
    }

    return {
      botMove: parsed.botMove,
      score,
      details: { captures },
    };
  }

  @Post('score')
  async score() {
    const score = await this.engineManager.estimateScore();
    return { score };
  }

  @Post('shutdown')
  shutdown() {
    this.engineManager.onModuleDestroy();
    return { message: 'Motor apagado' };
  }

  private async robustSendCommand(command: string, retries = 2): Promise<string> {
    for (let i = 0; i <= retries; i++) {
      const res = await this.engineManager.sendCommand(command);
      if (res) return res;
      this.logger.warn(`Intento ${i + 1}: respuesta vacía para ${command}`);
    }
    throw new Error(`No hubo respuesta para: ${command}`);
  }
}
