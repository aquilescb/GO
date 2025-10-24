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

// Escribe el analysis_web.cfg
export function writeAnalysisCfg(rc: RuntimeConfig): void {
  const eff = resolveEffective(rc);
  const lines: string[] = [
    `maxBoardXSizeForNNBuffer = ${rc.boardSize}`,
    `maxBoardYSizeForNNBuffer = ${rc.boardSize}`,
    `requireMaxBoardSize = true`,
    `komi = ${rc.komi}`,
    `rules = ${rc.rules}`,
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
    `logAllMoves = false`,
    `logSearchInfo = false`,
    ``,
    `allowIncludeOwnership = ${eff.allowIncludeOwnership}`,
    `allowIncludePolicy = ${eff.allowIncludePolicy}`,
    ``,
  ];

  fs.writeFileSync(rc.generatedCfgPath, lines.join('\n'), 'utf8');
}

export function modelAbsolutePath(rc: RuntimeConfig): string {
  return path.join(rc.networksDir, rc.networkFilename);
}
