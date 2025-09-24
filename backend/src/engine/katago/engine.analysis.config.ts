// src/engine/engine.analysis.config.ts
export const AnalysisConfig = {
  boardSize: 19,
  komi: 7.5,
  rules: 'chinese',
  maxVisits: 180, // 150–200 estable en CPU
  katagoExePath: 'engines/katago/katago.exe',
  networkDir: 'engines/katago/networks',
  analysisCfgPath: 'engines/katago/analysis_web.cfg',
};
