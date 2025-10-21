// src/engine/katago/runtime-config.ts
import * as path from 'path';
import * as fs from 'fs';

export type HardwareProfile = 'cpu-low' | 'cpu-mid' | 'gpu';
export type DifficultyPreset = 'easy' | 'medium' | 'hard' | 'pro';

export type RuntimeConfig = {
  boardSize: number;
  komi: number;
  rules: 'chinese' | 'japanese';
  katagoExePath: string;
  networksDir: string;
  networkFilename: string; // archivo dentro de networksDir
  generatedCfgPath: string; // dónde escribimos el analysis_web.cfg
  // Mezcla efectiva
  hardware: HardwareProfile;
  preset: DifficultyPreset;
};

export type KataEffective = {
  // parámetros efectivos que van al INI (analysis_web.cfg)
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
};

const HW: Record<
  HardwareProfile,
  Omit<
    KataEffective,
    | 'maxVisits'
    | 'analysisPVLen'
    | 'wideRootNoise'
    | 'ignorePreRootHistory'
    | 'reportAnalysisWinratesAs'
    | 'allowIncludeOwnership'
    | 'allowIncludePolicy'
  >
> = {
  'cpu-low': {
    numAnalysisThreads: 1,
    numSearchThreads: 1,
    nnCacheSizePowerOfTwo: 20,
    nnMutexPoolSizePowerOfTwo: 17,
    nnMaxBatchSize: 4,
    lagBuffer: 0.06,
  },
  'cpu-mid': {
    numAnalysisThreads: 1,
    numSearchThreads: 8,
    nnCacheSizePowerOfTwo: 21,
    nnMutexPoolSizePowerOfTwo: 18,
    nnMaxBatchSize: 8,
    lagBuffer: 0.05,
  },
  gpu: {
    numAnalysisThreads: 1,
    numSearchThreads: 12,
    nnCacheSizePowerOfTwo: 22,
    nnMutexPoolSizePowerOfTwo: 18,
    nnMaxBatchSize: 32,
    lagBuffer: 0.03,
  },
};

const PRESET: Record<
  DifficultyPreset,
  Pick<KataEffective, 'maxVisits' | 'analysisPVLen' | 'wideRootNoise'>
> = {
  easy: { maxVisits: 60, analysisPVLen: 5, wideRootNoise: 0.05 },
  medium: { maxVisits: 120, analysisPVLen: 6, wideRootNoise: 0.04 },
  hard: { maxVisits: 400, analysisPVLen: 6, wideRootNoise: 0.02 },
  pro: { maxVisits: 1000, analysisPVLen: 7, wideRootNoise: 0.01 },
};

export function resolveEffective(rc: RuntimeConfig): KataEffective {
  const hw = HW[rc.hardware];
  const p = PRESET[rc.preset];
  return {
    ...hw,
    ...p,
    ignorePreRootHistory: true,
    reportAnalysisWinratesAs: 'SIDETOMOVE',
    allowIncludeOwnership: true,
    allowIncludePolicy: true,
  };
}

// Escribe un analysis_web.cfg con base + mezcla efectiva
export function writeAnalysisCfg(rc: RuntimeConfig): void {
  const eff = resolveEffective(rc);
  const lines: string[] = [];

  // ===== Reglas / tamaño =====
  lines.push(
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
  );

  fs.writeFileSync(rc.generatedCfgPath, lines.join('\n'), 'utf8');
}

export function modelAbsolutePath(rc: RuntimeConfig): string {
  return path.join(rc.networksDir, rc.networkFilename);
}
