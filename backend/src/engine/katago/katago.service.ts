import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as readline from 'readline';
import type {
  Color,
  SessionData,
  KgAnalysisRaw,
  KgMoveInfo,
  PlayEvalV2Response,
  CandidateBlackDTO,
} from '../engine.types';

type J = Record<string, any>;

const AnalysisConfig = {
  boardSize: 19,
  komi: 7.5,
  rules: 'chinese',
  maxVisits: 90,
  katagoExePath: 'engines/katago/katago.exe',
  networkModelPath: 'engines/katago/networks/kata1-b15c192-s1672170752-d466197061.txt.gz',
  analysisCfgPath: 'engines/katago/analysis_web.cfg',
} as const;

/** Con tu CFG:
 *  - winrate = prob. de ganar del LADO AL TURNO (side-to-move)
 *  - scoreMean = ventaja de BLANCAS (white lead)
 */
const clamp01 = (x: number) => (Number.isFinite(x) ? (x < 0 ? 0 : x > 1 ? 1 : x) : 0.5);
const normalizeKGS = (s: string) => (s ?? '').trim().toUpperCase();

/** WR(side-to-move) -> WR de "user" */
function wrSTM_to_userWR(wrSTM: number | undefined, sideToMove: Color, user: Color): number {
  const w = typeof wrSTM === 'number' ? wrSTM : 0.5;
  return clamp01(sideToMove === user ? w : 1 - w);
}

/** white lead -> lead de "color" */
function lead_forColor(whiteLead: number | undefined, color: Color): number {
  const v = typeof whiteLead === 'number' ? whiteLead : 0;
  return color === 'w' ? v : -v;
}

/** Para tablas heredadas “WR Black / Score Black” */
function wrSTM_to_blackWR(wrSTM: number | undefined, sideToMove: Color): number {
  const w = typeof wrSTM === 'number' ? wrSTM : 0.5;
  return clamp01(sideToMove === 'b' ? w : 1 - w);
}

function toUpperMove(m?: string): string {
  return (m ?? 'PASS').toUpperCase();
}
function takePV5(m?: KgMoveInfo): string[] {
  const arr = Array.isArray(m?.pv) ? m!.pv : [];
  return arr.slice(0, 5).map(toUpperMove);
}
function getMoveInfos(res: KgAnalysisRaw): KgMoveInfo[] {
  const arr = res?.rootInfo?.moveInfos ?? res?.root?.moveInfos ?? res?.moveInfos ?? [];
  return Array.isArray(arr) ? arr : [];
}

/** Ordenar por “mejor para COLOR X” (usando lead de X) */
function sortByLeadForColor(moveInfos: KgMoveInfo[], color: Color): KgMoveInfo[] {
  return [...moveInfos]
    .map((mi) => ({ raw: mi, lead: lead_forColor(mi.scoreMean, color) }))
    .sort((a, b) => b.lead - a.lead)
    .map((s) => s.raw);
}

@Injectable()
export class KatagoService implements OnModuleDestroy {
  private readonly log = new Logger(KatagoService.name);
  private proc?: ChildProcessWithoutNullStreams;
  private rl?: readline.Interface;
  private pending = new Map<string, (v: any) => void>();
  private seq = 0;

  /** Sesión en memoria */
  private globalSession: SessionData = { moves: [], nextColor: 'b' };

  ensureRunning(): void {
    if (this.proc) return;
    const args = [
      'analysis',
      '-config',
      AnalysisConfig.analysisCfgPath,
      '-model',
      AnalysisConfig.networkModelPath,
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
    const ok = id && this.pending.get(id);
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
  onModuleDestroy() {
    this.stop();
  }

  warmup(): void {
    this.ensureRunning();
  }
  resetSession(): void {
    this.globalSession = { moves: [], nextColor: 'b' };
  }

  private async analyzePosition(moves: Array<[Color, string]>): Promise<KgAnalysisRaw> {
    const req = {
      rules: AnalysisConfig.rules,
      komi: AnalysisConfig.komi,
      boardXSize: AnalysisConfig.boardSize,
      boardYSize: AnalysisConfig.boardSize,
      moves,
      analyzeTurns: [moves.length],
      maxVisits: AnalysisConfig.maxVisits,
      includeOwnership: true,
      includePolicy: true,
    };
    return this.send<KgAnalysisRaw>(req);
  }

  /** ===== /game/play-eval (v2) ===== */
  async playEvalV2(userMoveRaw: string): Promise<PlayEvalV2Response> {
    if (!userMoveRaw) throw new Error('Falta move');

    const s = this.globalSession;
    const userColor: Color = s.nextColor;

    // 1) Baseline (usuario al turno)
    const baselineRes = await this.analyzePosition(s.moves);
    const baseBest = sortByLeadForColor(getMoveInfos(baselineRes), userColor)[0];
    const bestWRPre_user = wrSTM_to_userWR(baseBest?.winrate, userColor, userColor);
    const bestScorePre_user = lead_forColor(baseBest?.scoreMean, userColor);

    // 2) Juega usuario
    const userMove = normalizeKGS(userMoveRaw);
    s.moves.push([userColor, userMove]);

    // 3) Tras usuario (bot al turno)
    const afterUserRes = await this.analyzePosition(s.moves);
    const botColor: Color = userColor === 'b' ? 'w' : 'b';
    s.nextColor = botColor;

    const sortedForBot = sortByLeadForColor(getMoveInfos(afterUserRes), botColor);
    const bestBot = sortedForBot[0];
    const botMove = toUpperMove(bestBot?.move) || 'PASS';

    // Métricas del turno (perspectiva del USUARIO) — firmadas
    const wrAfterUser_user = wrSTM_to_userWR(bestBot?.winrate, botColor, userColor);
    const scoreAfterUser_user = Math.abs(lead_forColor(bestBot?.scoreMean, userColor));

    // Deltas ABS
    const lossWinrate = Math.abs(bestWRPre_user - wrAfterUser_user);
    const lossPoints = Math.abs(bestScorePre_user - scoreAfterUser_user);

    // 4) Mueve el bot → posición REAL
    s.moves.push([botColor, botMove]);
    s.nextColor = userColor;

    // 5) Recomendaciones del usuario (usuario al turno)
    const nextRes = await this.analyzePosition(s.moves);
    const sortedForUserNext = sortByLeadForColor(getMoveInfos(nextRes), userColor);

    // === Candidatas del USUARIO ===
    const movUserRecommendations: CandidateBlackDTO[] = sortedForUserNext.slice(0, 3).map((mi) => ({
      move: toUpperMove(mi.move),
      prior: typeof mi.prior === 'number' ? mi.prior : (mi.policy ?? 0) || 0,
      winrateBlack: wrSTM_to_blackWR(mi.winrate, userColor), // 0..1 (mostralo como % en el front)
      scoreMeanBlack: lead_forColor(mi.scoreMean, userColor), // ← AHORA: ventaja DEL USUARIO
      pv: takePV5(mi),
    }));

    // === Candidatas del BOT ===
    const movBotCandidates: CandidateBlackDTO[] = sortedForBot.slice(0, 3).map((mi) => ({
      move: toUpperMove(mi.move),
      prior: typeof mi.prior === 'number' ? mi.prior : (mi.policy ?? 0) || 0,
      winrateBlack: wrSTM_to_blackWR(mi.winrate, botColor), // 0..1 (mostralo como % en el front)
      scoreMeanBlack: lead_forColor(mi.scoreMean, botColor), // ← AHORA: ventaja DEL BOT
      pv: takePV5(mi),
    }));

    // Ownership (posición real)
    const ownershipFlat =
      nextRes?.rootInfo?.ownership ??
      nextRes?.root?.ownership ??
      nextRes?.ownership ??
      (Array.isArray(nextRes?.turns) ? nextRes.turns[0]?.ownership : undefined) ??
      [];

    return {
      MovBot: { botMove, candidates: movBotCandidates },
      MovUser: { recommendations: movUserRecommendations },
      metrics: {
        bestWRPre: bestWRPre_user,
        wrAfterUser: wrAfterUser_user,
        lossWinrate,
        bestScorePre: bestScorePre_user,
        scoreAfterUser: scoreAfterUser_user,
        lossPoints,
      },
      ownership: ownershipFlat,
      state: { moves: s.moves.map(([, mv]) => mv) },
    };
  }
}
