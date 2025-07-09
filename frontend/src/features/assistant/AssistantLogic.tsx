import { useEffect, useState } from "react";

const initialMessages = [
  "¡Hola! Soy tu asistente virtual de GO 🤖",
  "¿Listo para una buena partida?",
];

const tips = [
  "¡Cuidado con dejar piedras aisladas!",
  "Intenta formar cadenas para proteger tus piezas.",
  "Controlar el centro es clave.",
  "Jugar en los bordes puede ser estratégico.",
  "Observa los patrones del oponente.",
];

export function useAssistantAI(lastMove: { x: number; y: number } | null) {
  const [messages, setMessages] = useState<string[]>(initialMessages);
    useEffect(() => {
    if (!lastMove) return;

    const newTip = tips[Math.floor(Math.random() * tips.length)];
    const response = `🧠 ${newTip}`;

    setMessages((prev) => [...prev, response]);
  }, [lastMove]);

  return messages;
}
