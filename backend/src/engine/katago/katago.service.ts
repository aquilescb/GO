// src/engine/katago/katago.service.ts
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as readline from 'readline';

/** ===== Ajustes básicos (rutas/valores) ===== */
const AnalysisConfig = {
  boardSize: 19,
  komi: 7.5,
  rules: 'chinese',
  maxVisits: 180, // 150–200 va bien en CPU
  katagoExePath: 'engines/katago/katago.exe', // ajusta si tu ruta difiere
  networkDir: 'engines/katago/networks', // pasando el directorio, usa la red más nueva
  analysisCfgPath: 'engines/katago/analysis_web.cfg',
} as const;

/** ===== Tipos expuestos para el resto de la app ===== */
export type Color = 'b' | 'w';

export interface CandidateDTO {
  move: string;
  order: number; // 1..n
  prior: number; // policy prior [0..1]
  winrate: number; // [0..1]
  scoreMean: number;
}

export interface AnalysisDTO {
  scoreMean: number;
  winrate: number;
  pv: string[];
  ownership: number[]; // 19x19 = 361 valores en [-1,1]
  candidates: CandidateDTO[];
}

export interface PlayResponseDTO {
  botMove: string;
  analysis: AnalysisDTO;
}

export interface SessionData {
  moves: Array<[Color, string]>; // [['b','D4'],['w','Q16'], ...] en KGS (sin "I")
  nextColor: Color;
}

type J = Record<string, any>;

function normalizeKGS(s: string): string {
  // Coordenadas KGS: columnas A..T sin “I”, filas 1..19. Aceptamos minusc./espacios.
  return s.trim().toUpperCase();
}

@Injectable()
export class KatagoService implements OnModuleDestroy {
  private readonly log = new Logger(KatagoService.name);

  /** Proceso de KataGo en modo "analysis" (JSONL) */
  private proc?: ChildProcessWithoutNullStreams;
  private rl?: readline.Interface;

  /** Esperas pendientes por id (request/response) */
  private pending = new Map<string, (v: any) => void>();
  private seq = 0;

  /** Sesión ÚNICA (single-user / single-session) */
  private globalSession: SessionData = { moves: [], nextColor: 'b' };

  /** ===== Ciclo de vida del proceso ===== */

  ensureRunning(): void {
    if (this.proc) return;

    const args = [
      'analysis',
      '-config',
      AnalysisConfig.analysisCfgPath,
      '-model',
      'engines/katago/networks/kata1-b15c192-s1672170752-d466197061.txt.gz',
    ];

    this.log.log(`Launching KataGo: ${AnalysisConfig.katagoExePath} ${args.join(' ')}`);
    this.proc = spawn(AnalysisConfig.katagoExePath, args, { stdio: ['pipe', 'pipe', 'pipe'] });

    this.proc.stderr.on('data', (d) => this.log.warn(`[katago][stderr] ${d.toString()}`));
    this.proc.on('exit', (code) => this.log.error(`KataGo exited with code ${code}`));

    this.rl = readline.createInterface({ input: this.proc.stdout });
    this.rl.on('line', (line) => this.onLine(line));
  }

  private onLine(line: string) {
    if (!line.trim()) return;
    let msg: J;
    try {
      msg = JSON.parse(line);
    } catch {
      return;
    }
    const id = msg.id as string | undefined;
    if (!id) return;
    const ok = this.pending.get(id);
    if (ok) {
      this.pending.delete(id);
      ok(msg);
    }
  }

  private send<T = any>(payload: J, timeoutMs = 120_000): Promise<T> {
    if (!this.proc) this.ensureRunning();

    return new Promise<T>((resolve, reject) => {
      const id = `t${++this.seq}`;
      const full = { id, ...payload };

      const to = setTimeout(() => {
        this.pending.delete(id);
        reject(new Error('ENGINE_TIMEOUT'));
      }, timeoutMs);

      this.pending.set(id, (v) => {
        clearTimeout(to);
        resolve(v as T);
      });

      this.proc!.stdin.write(JSON.stringify(full) + '\n', (err) => {
        if (err) {
          clearTimeout(to);
          this.pending.delete(id);
          reject(err);
        }
      });
    });
  }

  stop(): void {
    try {
      this.rl?.close();
    } catch {}
    try {
      this.proc?.kill('SIGTERM');
    } catch {}
    this.pending.clear();
    this.proc = undefined;
    this.rl = undefined;
  }

  async onModuleDestroy() {
    this.stop();
  }

  /** ===== API de alto nivel para tu controller ===== */

  /** Precalienta el engine (arranca el proceso si no estaba). */
  warmup(): void {
    this.ensureRunning();
  }

  /** Resetea la sesión única (nuevo juego). */
  resetSession(): void {
    this.globalSession = { moves: [], nextColor: 'b' };
  }

  /** Pide análisis a KataGo para la posición actual (historial). */
  private async analyzePosition(moves: Array<['b' | 'w', string]>) {
    const req: J = {
      rules: AnalysisConfig.rules,
      komi: AnalysisConfig.komi,
      boardXSize: AnalysisConfig.boardSize,
      boardYSize: AnalysisConfig.boardSize,
      moves,
      analyzeTurns: [moves.length], // analizar la posición resultante luego de la última jugada
      maxVisits: AnalysisConfig.maxVisits,
      includeOwnership: true,
      includePolicy: true,
      // analysisPVLen: 20, // si querés forzar PV len por request (también puede ir en cfg)
    };
    return this.send<J>(req);
  }

  /**
   * Aplica la jugada del usuario en la sesión única, consulta KataGo y devuelve:
   * {
   *   botMove: "A1",
   *   analysis: { scoreMean, winrate, pv[], ownership[], candidates[] }
   * }
   */
  async playGlobal(move: string): Promise<PlayResponseDTO> {
    if (!move) throw new Error('Falta move');

    const s = this.globalSession;

    // 1) Registrar jugada del USUARIO
    const userMove = normalizeKGS(move);
    const color: Color = s.nextColor;
    s.moves.push([color, userMove]);
    s.nextColor = color === 'b' ? 'w' : 'b';

    // 2) ANÁLISIS #1 (lado que mueve ahora = BOT). De acá sale botMove.
    const res1 = await this.analyzePosition(s.moves);
    const { best: bestBotCand, sorted: sortedBot } = pickBestCandidate(res1);

    if (!bestBotCand) {
      // Sin sugerencias: devolver algo mínimo
      return {
        botMove: 'PASS',
        analysis: {
          scoreMean: 0,
          winrate: 0.5,
          pv: [],
          ownership: pickOwnership(res1),
          candidates: [],
        },
      };
    }

    const botMove = (bestBotCand.move ?? 'PASS').toUpperCase();

    // 3) Aplicar jugada del BOT a la sesión
    s.moves.push([s.nextColor, botMove]);
    s.nextColor = s.nextColor === 'b' ? 'w' : 'b';

    // 4) ANÁLISIS #2 (lado que mueve ahora = USUARIO). De acá salen PV, ownership y candidates PARA EL USUARIO.
    const res2 = await this.analyzePosition(s.moves);
    const { best: bestUserCand, sorted: sortedUser } = pickBestCandidate(res2);

    // Candidates: top-3 para el USUARIO
    const candidates = sortedUser.slice(0, 3).map((m: any, i: number) => ({
      move: (m.move ?? '').toUpperCase(),
      order: i + 1,
      prior: typeof m.prior === 'number' ? m.prior : (m.policy ?? 0),
      winrate: typeof m.winrate === 'number' ? m.winrate : 0.5,
      scoreMean: typeof m.scoreMean === 'number' ? m.scoreMean : 0,
    }));

    // PV recomendado para el USUARIO (del mejor candidate del análisis #2)
    const pv: string[] = Array.isArray(bestUserCand?.pv)
      ? bestUserCand.pv.map((p: string) => p.toUpperCase())
      : [];

    // Ownership del estado ACTUAL (tras mover el bot)
    const ownership: number[] = pickOwnership(res2);

    // Métricas: usamos scoreMean/winrate del mejor candidate para el USUARIO
    const scoreMean = typeof bestUserCand?.scoreMean === 'number' ? bestUserCand.scoreMean : 0;
    const winrate = typeof bestUserCand?.winrate === 'number' ? bestUserCand.winrate : 0.5;

    return {
      botMove,
      analysis: { scoreMean, winrate, pv, ownership, candidates },
    };
  }
}

// Helper functions moved outside the class

function pickBestCandidate(res: any): { best: any | null; sorted: any[] } {
  const root = res?.rootInfo ?? res?.root ?? {};
  const moveInfos = (root.moveInfos ?? res?.moveInfos ?? []) as any[];
  if (!Array.isArray(moveInfos) || moveInfos.length === 0) {
    return { best: null, sorted: [] };
  }
  const sorted = [...moveInfos].sort((a, b) => (b.scoreMean ?? 0) - (a.scoreMean ?? 0));
  return { best: sorted[0], sorted };
}

function pickOwnership(res: any): number[] {
  // KataGo puede ubicar ownership en distintos lugares según build/config:
  const tryPaths = [
    (o: any) => o?.rootInfo?.ownership,
    (o: any) => o?.root?.ownership,
    (o: any) => o?.ownership,
    (o: any) => Array.isArray(o?.turns) && o.turns[0]?.ownership,
  ];
  for (const f of tryPaths) {
    const v = f(res);
    if (Array.isArray(v)) return v as number[];
  }
  return []; // fallback si no vino
}
