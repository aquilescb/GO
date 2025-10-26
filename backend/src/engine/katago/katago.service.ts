// src/engine/katago/katago.service.ts
import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { spawn, ChildProcessWithoutNullStreams } from 'child_process';
import * as readline from 'readline';
import { writeAnalysisCfg, resolveModelAbsolutePath } from './runtime-config';
import { AnalysisConfig } from '../katago/engine.analysis.config';
import type {
  Color,
  SessionData,
  KgAnalysisRaw,
  KgMoveInfo,
  PlayEvalV2Response,
  CandidateBlackDTO,
} from '../engine.types';

type J = Record<string, any>;

const clamp01 = (x: number) => (Number.isFinite(x) ? (x < 0 ? 0 : x > 1 ? 1 : x) : 0.5);
const normalizeKGS = (s: string) => (s ?? '').trim().toUpperCase();

function wr_forColor(wrSTM: number | undefined, sideToMove: Color, target: Color) {
  const w = typeof wrSTM === 'number' ? wrSTM : 0.5;
  return clamp01(sideToMove === target ? w : 1 - w);
}

function lead_forColor(whiteLead: number | undefined, color: Color) {
  const v = typeof whiteLead === 'number' ? whiteLead : 0;
  return color === 'w' ? v : -v;
}

function toUpperMove(m?: string): string {
  return (m ?? 'PASS').toUpperCase();
}

function takePV5(m?: KgMoveInfo): string[] {
  return (Array.isArray(m?.pv) ? m.pv : []).slice(0, 5).map(toUpperMove);
}

function getMoveInfos(res: KgAnalysisRaw): KgMoveInfo[] {
  const arr = res?.rootInfo?.moveInfos ?? res?.root?.moveInfos ?? res?.moveInfos ?? [];
  return Array.isArray(arr) ? arr : [];
}

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
  private pending = new Map<
    string,
    { resolve: (v: any) => void; reject: (e: any) => void; last?: any }
  >();

  private seq = 0;

  private session: SessionData = { moves: [], nextColor: 'b' };

  applyConfigAndRestart(): void {
    writeAnalysisCfg(AnalysisConfig);
    this.stop();
    this.ensureRunning();
  }

  ensureRunning(): void {
    if (this.proc) return;

    // Modelo principal (fuerte)
    const main = resolveModelAbsolutePath(
      AnalysisConfig.networksDir,
      AnalysisConfig.networkFilename,
    );

    // Humano (opcional). Si no está seteado o no existe, no se usa.
    let human: { path: string; format: 'bin' | 'txt' } | null = null;
    if (AnalysisConfig.humanModelFilename) {
      try {
        human = resolveModelAbsolutePath(
          AnalysisConfig.networksDir,
          AnalysisConfig.humanModelFilename,
        );
      } catch {
        human = null;
      }
    }

    const args = ['analysis', '-config', AnalysisConfig.generatedCfgPath, '-model', main.path];

    if (human) {
      args.push('-human-model', human.path);
    }

    this.log.log(
      `Launching KataGo: ${AnalysisConfig.katagoExePath}\n` +
        `  -model: ${main.path} (fmt=${main.format.toUpperCase()})\n` +
        (human ? `  -human-model: ${human.path} (fmt=${human.format.toUpperCase()})\n` : '') +
        `  -config: ${AnalysisConfig.generatedCfgPath}`,
    );

    this.proc = spawn(AnalysisConfig.katagoExePath, args, { stdio: ['pipe', 'pipe', 'pipe'] });
    this.proc.stderr.on('data', (d) => this.log.warn(`[katago][stderr] ${d.toString()}`));
    this.proc.on('exit', (code) => this.log.error(`KataGo exited with code ${code}`));
    this.rl = readline.createInterface({ input: this.proc.stdout });
    this.rl.on('line', (line) => this.onLine(line));
  }
  private onLine(line: string) {
    const s = line?.trim();
    if (!s) return;

    // KataGo a veces imprime texto que no es JSON; lo ignoramos.
    if (s[0] !== '{' && s[s.length - 1] !== '}') {
      this.log.debug(`[katago][nonjson] ${s}`);
      return;
    }

    let msg: any;
    try {
      msg = JSON.parse(s);
    } catch {
      // Si parece JSON pero no parsea, lo ignoramos sin romper el proceso.
      this.log.warn(`[katago][badjson] ${s.slice(0, 200)}`);
      return;
    }

    const id = msg?.id as string | undefined;
    if (!id) return;

    const pend = this.pending.get(id);
    if (!pend) return;

    // Si vino un error explícito desde el engine, rechazamos.
    if (msg.error) {
      this.pending.delete(id);
      pend.reject(new Error(typeof msg.error === 'string' ? msg.error : 'ENGINE_ERROR'));
      return;
    }

    // El analysis stream emite múltiples updates con el mismo id.
    // Guardamos la última y RESOLVEMOS SOLO cuando termina la búsqueda.
    // Heurística: si trae isDuringSearch === false o no existe la flag pero ya hay root/rootInfo.
    const isFinal =
      msg.isDuringSearch === false ||
      (msg.isDuringSearch === undefined && (msg.rootInfo || msg.root || msg.moveInfos));

    if (isFinal) {
      this.pending.delete(id);
      pend.resolve(msg);
    } else {
      // acumulamos por si quisieras usar updates intermedios
      pend.last = msg;
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

      this.pending.set(id, {
        resolve: (v) => {
          clearTimeout(to);
          resolve(v as T);
        },
        reject: (e) => {
          clearTimeout(to);
          reject(e);
        },
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
    this.applyConfigAndRestart();
  }

  resetSession(): void {
    this.session = { moves: [], nextColor: 'b' };
  }

  private async analyzePosition(moves: Array<[Color, string]>): Promise<KgAnalysisRaw> {
    const req = {
      rules: AnalysisConfig.rules,
      komi: AnalysisConfig.komi,
      boardXSize: AnalysisConfig.boardSize,
      boardYSize: AnalysisConfig.boardSize,
      moves,
      analyzeTurns: [moves.length],
      includeOwnership: true,
      includePolicy: true,
    };
    return this.send<KgAnalysisRaw>(req);
  }

  async playEvalV2(userMoveRaw: string): Promise<PlayEvalV2Response> {
    if (!userMoveRaw) throw new Error('Falta move');

    const s = this.session;
    const userColor: Color = s.nextColor;
    const botColor: Color = userColor === 'b' ? 'w' : 'b';

    // Helpers locales para leer root (distintos builds)
    const rootWr = (r: KgAnalysisRaw) => r?.rootInfo?.winrate ?? r?.root?.winrate;
    const rootLead = (r: KgAnalysisRaw) => {
      const rr = r?.rootInfo ?? r?.root;
      return rr?.scoreLead ?? rr?.scoreMean;
    };

    // ========== PASO 1: BASELINE - Analizar ANTES de que juegue el usuario ==========
    const baselineRes = await this.analyzePosition(s.moves);
    const baselineMoves = getMoveInfos(baselineRes);
    const baseBest = sortByLeadForColor(baselineMoves, userColor)[0];

    // Guardas (posición terminal o sin candidatos)
    if (!baseBest || !baseBest.move) {
      const userMove = normalizeKGS(userMoveRaw) || 'PASS';
      s.moves.push([userColor, userMove]);
      s.nextColor = botColor;

      const afterUserRes = await this.analyzePosition(s.moves);
      const sortedForBot = sortByLeadForColor(getMoveInfos(afterUserRes), botColor);
      const botMove = toUpperMove(sortedForBot[0]?.move) || 'PASS';

      s.moves.push([botColor, botMove]);
      s.nextColor = userColor;

      const nextRes = await this.analyzePosition(s.moves);
      const sortedForUserNext = sortByLeadForColor(getMoveInfos(nextRes), userColor);

      const movUserRecommendations: CandidateBlackDTO[] = sortedForUserNext
        .slice(0, 3)
        .map((mi) => ({
          move: toUpperMove(mi.move),
          prior: typeof mi.prior === 'number' ? mi.prior : (mi.policy ?? 0) || 0,
          // hijo => sideToMove es el oponente del usuario
          winrateBlack: wr_forColor(mi.winrate, userColor === 'b' ? 'w' : 'b', userColor),
          scoreMeanBlack: lead_forColor(mi.scoreMean, userColor),
          pv: takePV5(mi),
        }));

      const movBotCandidates: CandidateBlackDTO[] = sortedForBot.slice(0, 3).map((mi) => ({
        move: toUpperMove(mi.move),
        prior: typeof mi.prior === 'number' ? mi.prior : (mi.policy ?? 0) || 0,
        // hijo => sideToMove es el oponente del bot (usuario)
        winrateBlack: wr_forColor(mi.winrate, botColor === 'b' ? 'w' : 'b', botColor),
        scoreMeanBlack: lead_forColor(mi.scoreMean, botColor),
        pv: takePV5(mi),
      }));

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
          bestWRPre: 0.5,
          wrAfterUser: 0.5,
          lossWinrate: 0,
          bestScorePre: 0,
          scoreAfterUser: 0,
          lossPoints: 0,
        },
        ownership: ownershipFlat,
        state: { moves: s.moves.map(([, mv]) => mv) },
      };
    }

    // Mejor jugada del baseline (CHILD del root). OJO: en el hijo juega el BOT.
    let bestWRPre = wr_forColor(
      baseBest.winrate,
      /*sideToMove child*/ botColor,
      /*target*/ userColor,
    );
    let bestScorePre = lead_forColor(baseBest.scoreMean, userColor);

    // ========== PASO 2: BUSCAR la jugada del usuario EN EL BASELINE ==========
    const userMove = normalizeKGS(userMoveRaw);
    const userMoveInBaseline = baselineMoves.find(
      (mi) => mi.move && normalizeKGS(mi.move) === userMove,
    );

    let userMoveWR: number;
    let userMoveScore: number;

    if (userMoveInBaseline) {
      // === CAMINO "HIT" === (child vs child, ambos del baseline)
      userMoveWR = wr_forColor(userMoveInBaseline.winrate, /*child*/ botColor, userColor);
      userMoveScore = lead_forColor(userMoveInBaseline.scoreMean, userColor);
      this.log.debug(`✓ Jugada ${userMove} encontrada en baseline (child vs child).`);
    } else {
      // === CAMINO "MISS" ===  (child-root vs child-root) ← Opción A
      this.log.warn(`⚠️ Jugada ${userMove} NO en baseline — aplicando child-root vs child-root.`);

      // A) Forzar BEST del baseline como hijo y leer ROOT del hijo
      const bestMoveForced = toUpperMove(baseBest.move);
      const tempBestMoves = [...s.moves, [userColor, bestMoveForced]] as Array<[Color, string]>;
      const tempBestRes = await this.analyzePosition(tempBestMoves);
      const rootWrBest = rootWr(tempBestRes);
      const rootLeadBest = rootLead(tempBestRes);
      bestWRPre = wr_forColor(rootWrBest, /*sideToMove child*/ botColor, userColor);
      bestScorePre = lead_forColor(rootLeadBest, userColor);

      // B) Forzar USER move como hijo y leer ROOT del hijo
      const tempUserMoves = [...s.moves, [userColor, userMove]] as Array<[Color, string]>;
      const tempUserRes = await this.analyzePosition(tempUserMoves);
      const rootWrUser = rootWr(tempUserRes);
      const rootLeadUser = rootLead(tempUserRes);
      userMoveWR = wr_forColor(rootWrUser, /*sideToMove child*/ botColor, userColor);
      userMoveScore = lead_forColor(rootLeadUser, userColor);
    }

    // ========== PASO 3: DELTA (signados, sin umbrales) ==========
    const deltaWinrate = bestWRPre - userMoveWR; // >0 = tu jugada peor que la mejor
    const deltaScore = bestScorePre - userMoveScore;

    // ========== PASO 4: APLICAR la jugada del usuario ==========
    s.moves.push([userColor, userMove]);

    // ========== PASO 5: BOT responde ==========
    const afterUserRes = await this.analyzePosition(s.moves);
    s.nextColor = botColor;
    const sortedForBot = sortByLeadForColor(getMoveInfos(afterUserRes), botColor);
    const bestBot = sortedForBot[0];
    const botMove = toUpperMove(bestBot?.move) || 'PASS';

    s.moves.push([botColor, botMove]);
    s.nextColor = userColor;

    // ========== PASO 6: Recomendaciones para el usuario ==========
    const nextRes = await this.analyzePosition(s.moves);
    const sortedForUserNext = sortByLeadForColor(getMoveInfos(nextRes), userColor);

    const movUserRecommendations: CandidateBlackDTO[] = sortedForUserNext.slice(0, 3).map((mi) => ({
      move: toUpperMove(mi.move),
      prior: typeof mi.prior === 'number' ? mi.prior : (mi.policy ?? 0) || 0,
      // hijo => sideToMove es el oponente
      winrateBlack: wr_forColor(mi.winrate, userColor === 'b' ? 'w' : 'b', userColor),
      scoreMeanBlack: lead_forColor(mi.scoreMean, userColor),
      pv: takePV5(mi),
    }));

    const movBotCandidates: CandidateBlackDTO[] = sortedForBot.slice(0, 3).map((mi) => ({
      move: toUpperMove(mi.move),
      prior: typeof mi.prior === 'number' ? mi.prior : (mi.policy ?? 0) || 0,
      // hijo => sideToMove es el oponente del bot (usuario)
      winrateBlack: wr_forColor(mi.winrate, botColor === 'b' ? 'w' : 'b', botColor),
      scoreMeanBlack: lead_forColor(mi.scoreMean, botColor),
      pv: takePV5(mi),
    }));

    const ownershipFlat =
      nextRes?.rootInfo?.ownership ??
      nextRes?.root?.ownership ??
      nextRes?.ownership ??
      (Array.isArray(nextRes?.turns) ? nextRes.turns[0]?.ownership : undefined) ??
      [];

    // 🔍 DEBUG
    this.log.debug(`
    === DELTA 1-ply ===  User=${userColor} Move=${userMove}
    BestRef: WR=${(bestWRPre * 100).toFixed(2)}%  Pts=${bestScorePre.toFixed(3)}
    UserRef: WR=${(userMoveWR * 100).toFixed(2)}%  Pts=${userMoveScore.toFixed(3)}
    ΔWR=${(deltaWinrate * 100).toFixed(2)}%  ΔPts=${deltaScore.toFixed(3)}
    BotMove=${botMove}
      `);

    return {
      MovBot: { botMove, candidates: movBotCandidates },
      MovUser: { recommendations: movUserRecommendations },
      metrics: {
        bestWRPre: bestWRPre,
        wrAfterUser: userMoveWR,
        lossWinrate: deltaWinrate,
        bestScorePre: bestScorePre,
        scoreAfterUser: userMoveScore,
        lossPoints: deltaScore,
      },
      ownership: ownershipFlat,
      state: { moves: s.moves.map(([, mv]) => mv) },
    };
  }
}
