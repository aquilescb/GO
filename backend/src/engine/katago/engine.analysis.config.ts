// src/engine/katago/engine.analysis.config.ts
import { RuntimeConfig } from '../katago/runtime-config';

export const AnalysisConfig: RuntimeConfig & {
  humanModelFilename?: string;
  humanSLProfile?: string;
} = {
  boardSize: 19,
  komi: 7.5,

  // 👇 Tipar literal con as const o directamente usar uno válido
  rules: 'chinese', // ✅ coincide con 'chinese' | 'japanese'

  katagoExePath: process.env.KATAGO_EXE_PATH ?? 'engines/katago/katago.exe',
  networksDir: process.env.KATAGO_NETWORKS_DIR ?? 'engines/katago/networks',
  networkFilename: process.env.KATAGO_MODEL ?? 'kata1-b15c192-s1672170752-d466197061',

  generatedCfgPath: process.env.KATAGO_CFG_PATH ?? 'engines/katago/analysis_web.cfg',

  hardware: (process.env.KATAGO_HW as any) ?? 'cpu-low',
  preset: (process.env.KATAGO_PRESET as any) ?? 'medium',

  // Campos nuevos
  humanModelFilename: process.env.KATAGO_HUMAN_MODEL ?? 'b18c384nbt-humanv0',
  humanSLProfile: process.env.KATAGO_HUMAN_PROFILE ?? 'rank_10k',

  overrides: {},
};
