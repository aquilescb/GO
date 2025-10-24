// src/engine/engine.analysis.config.ts
import { RuntimeConfig } from '../katago/runtime-config';

export const AnalysisConfig: RuntimeConfig = {
  boardSize: 19,
  komi: 7.5,
  rules: 'chinese',
  katagoExePath: process.env.KATAGO_EXE_PATH ?? 'engines/katago/katago.exe',
  networksDir: process.env.KATAGO_NETWORKS_DIR ?? 'engines/katago/networks',
  networkFilename: process.env.KATAGO_NETWORK_FILE ?? 'kata1-b15c192-s1672170752-d466197061.txt.gz',
  generatedCfgPath: process.env.KATAGO_CFG_PATH ?? 'engines/katago/analysis_web.cfg',
  hardware: (process.env.KATAGO_HW as any) ?? 'cpu-low',
  preset: (process.env.KATAGO_PRESET as any) ?? 'medium',

  // <<< NUEVO: overrides vacíos por defecto
  overrides: {},
};
