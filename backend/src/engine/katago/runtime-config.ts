// src/engine/katago/runtime-config.ts
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

export type HardwareProfile = 'cpu-low' | 'cpu-mid' | 'gpu';
export type DifficultyPreset = 'easy' | 'medium' | 'hard' | 'pro';

export type RuntimeOverrides = Partial<{
  maxVisits: number;
  selectionTemperature: number; // <<< NUEVO: temperatura para elegir jugada del bot
  numSearchThreads: number; // override manual (por defecto AUTO)
  analysisPVLen: number;
  wideRootNoise: number;
}>;

export type RuntimeConfig = {
  boardSize: number;
  komi: number;
  rules: 'chinese' | 'japanese';
  katagoExePath: string;
  networksDir: string;
  networkFilename: string;
  generatedCfgPath: string;
  hardware: HardwareProfile;
  preset: DifficultyPreset;
  overrides?: RuntimeOverrides; // <<< NUEVO
};

export type KataEffective = {
  // van al analysis_web.cfg
  numAnalysisThreads: number;
  numSearchThreads: number;
  nnCacheSizePowerOfTwo: number;
  nnMutexPoolSizePowerOfTwo: number;
  nnMaxBatchSize: number;
  lagBuffer: number;
  maxVisits: number;
  analysisPVLen: number;
  wideRootNoise: number;
  ignorePreRootHistory: boolean;
  reportAnalysisWinratesAs: 'SIDETOMOVE';
  allowIncludeOwnership: boolean;
  allowIncludePolicy: boolean;

  // sólo backend (no va al cfg)
  selectionTemperature: number; // <<< NUEVO
};

const HW_BASE = {
  'cpu-low': {
    numAnalysisThreads: 1,
    // numSearchThreads: AUTO (abajo)
    nnCacheSizePowerOfTwo: 20,
    nnMutexPoolSizePowerOfTwo: 17,
    nnMaxBatchSize: 4,
    lagBuffer: 0.06,
  },
  'cpu-mid': {
    numAnalysisThreads: 1,
    nnCacheSizePowerOfTwo: 21,
    nnMutexPoolSizePowerOfTwo: 18,
    nnMaxBatchSize: 8,
    lagBuffer: 0.05,
  },
  gpu: {
    numAnalysisThreads: 1,
    nnCacheSizePowerOfTwo: 22,
    nnMutexPoolSizePowerOfTwo: 18,
    nnMaxBatchSize: 32,
    lagBuffer: 0.03,
  },
} as const;

const PRESET = {
  easy: { maxVisits: 60, analysisPVLen: 5, wideRootNoise: 0.05, temp: 0.8 },
  medium: { maxVisits: 120, analysisPVLen: 6, wideRootNoise: 0.04, temp: 0.5 },
  hard: { maxVisits: 400, analysisPVLen: 6, wideRootNoise: 0.02, temp: 0.15 },
  pro: { maxVisits: 1000, analysisPVLen: 7, wideRootNoise: 0.01, temp: 0.05 },
} as const;

export function resolveEffective(rc: RuntimeConfig): KataEffective {
  const hw = HW_BASE[rc.hardware];
  const p = PRESET[rc.preset];

  // Threads AUTO para cpu-low (y default en general)
  const autoThreads = Math.max(1, Math.min(8, (os.cpus()?.length ?? 2) - 1));

  const eff: KataEffective = {
    numAnalysisThreads: hw.numAnalysisThreads,
    numSearchThreads: autoThreads,
    nnCacheSizePowerOfTwo: hw.nnCacheSizePowerOfTwo,
    nnMutexPoolSizePowerOfTwo: hw.nnMutexPoolSizePowerOfTwo,
    nnMaxBatchSize: hw.nnMaxBatchSize,
    lagBuffer: hw.lagBuffer,

    maxVisits: p.maxVisits,
    analysisPVLen: p.analysisPVLen,
    wideRootNoise: p.wideRootNoise,

    ignorePreRootHistory: true,
    reportAnalysisWinratesAs: 'SIDETOMOVE',
    allowIncludeOwnership: true,
    allowIncludePolicy: true,

    selectionTemperature: p.temp,
  };

  // Overrides
  const ov = rc.overrides ?? {};
  if (typeof ov.maxVisits === 'number') eff.maxVisits = ov.maxVisits;
  if (typeof ov.analysisPVLen === 'number') eff.analysisPVLen = ov.analysisPVLen;
  if (typeof ov.wideRootNoise === 'number') eff.wideRootNoise = ov.wideRootNoise;
  if (typeof ov.numSearchThreads === 'number') eff.numSearchThreads = ov.numSearchThreads;
  if (typeof ov.selectionTemperature === 'number')
    eff.selectionTemperature = ov.selectionTemperature;

  return eff;
}
function exists(p: string) {
  try {
    return fs.existsSync(p);
  } catch {
    return false;
  }
}
// Escribe el analysis_web.cfg
export function writeAnalysisCfg(
  rc: RuntimeConfig & {
    humanSLProfile?: string;
  },
) {
  const eff = resolveEffective(rc);
  const lines: string[] = [
    `maxBoardXSizeForNNBuffer = ${rc.boardSize}`,
    `maxBoardYSizeForNNBuffer = ${rc.boardSize}`,
    `requireMaxBoardSize = true`,
    // OJO: komi/rules se pasan en la request JSON → no ponerlos para evitar "Unused key"
    ``,
    `# ===== Rendimiento =====`,
    `numAnalysisThreads = ${eff.numAnalysisThreads}`,
    `numSearchThreads = ${eff.numSearchThreads}`,
    `nnCacheSizePowerOfTwo = ${eff.nnCacheSizePowerOfTwo}`,
    `nnMutexPoolSizePowerOfTwo = ${eff.nnMutexPoolSizePowerOfTwo}`,
    `nnMaxBatchSize = ${eff.nnMaxBatchSize}`,
    `maxVisits = ${eff.maxVisits}`,
    `analysisPVLen = ${eff.analysisPVLen}`,
    `wideRootNoise = ${eff.wideRootNoise}`,
    `ignorePreRootHistory = ${eff.ignorePreRootHistory}`,
    ``,
    `# ===== Reporte =====`,
    `reportAnalysisWinratesAs = ${eff.reportAnalysisWinratesAs}`,
    `logToStderr = true`,
    ``,
  ];

  // Si vas a usar -human-model, KataGo requiere el perfil:
  if (rc.humanSLProfile) {
    lines.push(`# ===== Human SL =====`);
    lines.push(`humanSLProfile = ${rc.humanSLProfile}`);
    lines.push(``);
  }

  fs.writeFileSync(rc.generatedCfgPath, lines.join('\n'), 'utf8');
}

export function resolveModelAbsolutePath(
  networksDir: string,
  networkFilename: string,
): {
  path: string;
  format: 'bin' | 'txt';
} {
  // 1) Si viene ruta absoluta válida, usar tal cual
  if (path.isAbsolute(networkFilename) && exists(networkFilename)) {
    const fmt = networkFilename.endsWith('.bin.gz') ? 'bin' : 'txt';
    return { path: networkFilename, format: fmt };
  }

  // 2) Candidatos dentro de networksDir
  const hasExt = /\.((bin|txt)\.gz)$/i.test(networkFilename);
  const candidates: Array<{ p: string; fmt: 'bin' | 'txt' }> = [];

  if (hasExt) {
    const p = path.join(networksDir, networkFilename);
    const fmt = networkFilename.toLowerCase().endsWith('.bin.gz') ? 'bin' : 'txt';
    candidates.push({ p, fmt });
  } else {
    // Sin extensión: preferir formato nuevo y luego antiguo
    candidates.push({ p: path.join(networksDir, `${networkFilename}.bin.gz`), fmt: 'bin' });
    candidates.push({ p: path.join(networksDir, `${networkFilename}.txt.gz`), fmt: 'txt' });
  }

  for (const c of candidates) {
    if (exists(c.p)) return { path: c.p, format: c.fmt };
  }

  // 3) Mensaje claro si no se encontró nada
  const tried = candidates.map((c) => c.p).join('\n  - ');
  throw new Error(
    `No se encontró el modelo de red. Intentos:\n  - ${tried}\n` +
      `Verificá networksDir="${networksDir}" y networkFilename="${networkFilename}".`,
  );
}

/** Compat de firma vieja (por si la usás en otros lados). */
export function modelAbsolutePath(rc: RuntimeConfig): string {
  return resolveModelAbsolutePath(rc.networksDir, rc.networkFilename).path;
}
