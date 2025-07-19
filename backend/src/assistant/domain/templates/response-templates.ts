import { BoardContext, PlayerProfile,EngineEvaluation } from '../types/assistant.types';

export const ResponseTemplates = {
  threats: {
    group_at_risk: [
      "¿Ese grupo podrá sobrevivir si el oponente lo ataca?",
      "Pensá si ese grupo tiene suficientes libertades o conexiones.",
      "¿Ese grupo tiene al menos dos ojos potenciales?",
    ],
  },

  opportunities: {
    connect_group: [
      "¿Lograste fortalecer tu posición con esa conexión?",
      "Unir grupos puede darte estabilidad. ¿Era necesario ahora?",
      "¿Esa conexión evita que el oponente te separe más adelante?",
    ],
  },

  patterns: {
    overconcentration: [
      "¿Estás jugando muchas piedras en una misma zona?",
      "Intentá distribuir tu influencia por todo el tablero.",
      "Podrías estar limitando tu expansión al quedarte en una región.",
    ],
    isolated_group: [
      "¿Ese grupo tiene chances de conectarse o está aislado?",
      "Jugá con cuidado cuando estás aislado: las capturas son probables.",
      "¿Cuál es el plan para salvar ese grupo?",
    ],
  },

  analogies: {
    group_at_risk: [
      "Un general no deja una tropa sin suministros: ese grupo parece desprotegido.",
      "Como un castillo sin murallas: tu grupo puede ser fácilmente invadido.",
    ],
    overconcentration: [
      "Como regar solo una parte del campo: estás desperdiciando potencial.",
      "No pongas todos los huevos en la misma canasta: expandí tu influencia.",
    ],
    default: [
      "En GO, como en la vida, el equilibrio vence a la obsesión.",
      "A veces, la mejor defensa es no estar ahí.",
    ],
  },

  drills: [
    "Juega 3 variantes que aseguren libertades a un grupo en riesgo.",
    "Practica conectar grupos separados en al menos 2 escenarios.",
    "Jugá una partida comenzando desde una posición de desventaja para practicar defensa.",
  ],

  genericByLevel: {
    beginner: [
      "¿Qué objetivo tenía esa jugada? ¿Defender? ¿Atacar? ¿Expandirse?",
      "¿Qué parte del tablero es más urgente ahora?",
    ],
    intermediate: [
      "¿Tu jugada crea influencia o territorio?",
      "¿Estás leyendo posibles secuencias o solo reaccionando?",
    ],
    advanced: [
      "¿Cuál es la implicancia estratégica de esta jugada?",
      "¿Tu jugada tiene doble propósito o es reactiva?",
    ],
  },
  evaluation: {
  atari: [
    "¿Estás en atari? ¿Tenés opciones para escapar o defenderte?",
    "¿Vale la pena salvar esa piedra o es mejor sacrificarla con propósito?",
  ],
  highRisk: [
    "¿Este movimiento agrava una posición vulnerable?",
    "Tu grupo está en peligro. ¿Cuál es tu prioridad ahora?",
  ],
  lowLiberties: [
    "¿Tenés suficientes libertades para resistir un ataque?",
    "¿Cómo podés aumentar el espacio de maniobra de tu grupo?",
  ]
},
    engine: {
    connectsGroups: [
      "¿Esa jugada conectó tus grupos? ¿Podías haber esperado?",
      "Unir grupos es útil, pero... ¿lo era ahora estratégicamente?",
    ],
    createsEye: [
      "¿Intentás crear un ojo con esa jugada? ¿Era necesario?",
      "Generar ojos es clave, pero asegurá que el grupo lo necesite.",
    ],
    threatensCapture: [
      "¿Amenazaste una captura? ¿Hay una buena continuación?",
      "Las amenazas sin seguimiento pueden ser ineficaces. ¿Qué sigue?",
    ],
  },

};

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateSocraticQuestion(
  context: BoardContext,
  profile: PlayerProfile,
  evaluation?: EngineEvaluation
): string {
  const { threats, opportunities, patternsDetected } = context;
  const level = profile.level;

  // Evaluación táctica primero
  if (evaluation?.isAtari) {
    return getRandom(ResponseTemplates.evaluation.atari);
  }

  if (evaluation?.riskLevel === 'high') {
    return getRandom(ResponseTemplates.evaluation.highRisk);
  }

  if (evaluation?.liberties !== undefined && evaluation.liberties <= 2) {
    return getRandom(ResponseTemplates.evaluation.lowLiberties);
  }

  // Amenazas del contexto
  for (const threat of threats) {
    if (threat in ResponseTemplates.threats) {
      return getRandom(ResponseTemplates.threats[threat]);
    }
  }
  //sobreconcentración detectada
  if (evaluation?.overconcentrated) {
    return getRandom(ResponseTemplates.patterns.overconcentration);
  }

  // Oportunidades del contexto
  for (const opportunity of opportunities) {
    if (opportunity in ResponseTemplates.opportunities) {
      return getRandom(ResponseTemplates.opportunities[opportunity]);
    }
  }

  // Patrones detectados
  for (const pattern of patternsDetected) {
    if (pattern in ResponseTemplates.patterns) {
      return getRandom(ResponseTemplates.patterns[pattern]);
    }
  }
  // Engine-based heuristics
  if (evaluation?.connectsGroups) return getRandom(ResponseTemplates.engine.connectsGroups);
  if (evaluation?.createsEye) return getRandom(ResponseTemplates.engine.createsEye);
  if (evaluation?.threatensCapture) return getRandom(ResponseTemplates.engine.threatensCapture);

  // Fallback por nivel
  return getRandom(
    ResponseTemplates.genericByLevel[level] || [
      "¿Qué impacto creés que tendrá esta jugada en la posición general?",
    ]
  );
}

export function generateAnalogy(context: BoardContext, profile: PlayerProfile, evaluation?: EngineEvaluation): string {

  if (evaluation?.overconcentrated) {
    return getRandom(ResponseTemplates.analogies.overconcentration);
  }
  for (const threat of context.threats) {
    const analogies = ResponseTemplates.analogies[threat];
    if (analogies) return getRandom(analogies);
  }
  return getRandom(ResponseTemplates.analogies.default);
}

export function generateDrillExercise(_: BoardContext, __: PlayerProfile): string {
  return getRandom(ResponseTemplates.drills);
}
