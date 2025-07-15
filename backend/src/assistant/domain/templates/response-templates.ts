// Este método analiza la jugada y el contexto del tablero
// Devuelve un resumen de amenazas, oportunidades y patrones detectados
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
};
