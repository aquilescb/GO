import { BadRequestException, Body, Controller, Post } from '@nestjs/common';
import { KatagoService } from './katago/katago.service';

@Controller('game')
export class GameController {
  constructor(private readonly katago: KatagoService) {}

  // Iniciar partida: calienta el motor y resetea la única sesión global
  @Post('start')
  async start() {
    this.katago.warmup();
    this.katago.resetSession();
    return { ok: true, message: 'Motor iniciando' };
  }

  // Jugar: el body trae { move: "B2" } en KGS (sin letra I)
  @Post('play')
  async play(@Body() body: { move: string }) {
    if (!body?.move) throw new BadRequestException('Falta move.');
    const payload = await this.katago.playGlobal(body.move);
    return payload; // { botMove, analysis: { scoreMean, winrate, pv, ownership, candidates } }
  }

  // Apagar proceso de KataGo (opcional)
  @Post('shutdown')
  async shutdown() {
    this.katago.stop();
    return { ok: true, message: 'Engine detenido' };
  }
}
