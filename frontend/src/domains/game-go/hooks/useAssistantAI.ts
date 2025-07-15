import { useEffect, useRef, useState } from "react";
import type { Move } from "@/domains/game-go/types/game";

export function useAssistantAI(
  lastMoves: Move[],
  stones: Move[]
) {
  const [messages, setMessages] = useState<string[]>([
    "¡Hola! Soy tu asistente virtual de GO 🤖",
    "¿Listo para una buena partida?",
  ]);

  const lastMoveKeyRef = useRef<string | null>(null);

  useEffect(() => {
    if (!lastMoves.length) return;

    const move = lastMoves[lastMoves.length - 1];
    const moveKey = `${move.x}-${move.y}`;

    // Evita análisis repetidos
    if (lastMoveKeyRef.current === moveKey) return;
    lastMoveKeyRef.current = moveKey;

    // Construcción del tablero
    const boardSize = 19;
    const board: ("black" | "white" | null)[][] = Array.from(
      { length: boardSize },
      () => Array(boardSize).fill(null)
    );

    for (const stone of stones) {
      board[stone.x][stone.y] = stone.color;
    }

    const fetchComentario = async () => {
      try {
        const res = await fetch("http://localhost:3000/assistant/think", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            move,        // 👈 agregado para cumplir con el backend
            board,
            lastMoves,
            playerProfile: {
              level: "beginner",
              style: "balanced",
              commonMistakes: ["overconcentration"],
            },
          }),
        });

        const result = await res.json();
        if (result?.message) {
          setMessages((prev) => [...prev, `🧠 ${result.message}`]);
        } else {
          setMessages((prev) => [...prev, `⚠️ Respuesta vacía del asistente`]);
        }
      } catch (error) {
        console.error("Error en el asistente:", error);
        setMessages((prev) => [
          ...prev,
          `⚠️ No se pudo contactar al asistente`,
        ]);
      }
    };

    fetchComentario();
  }, [lastMoves]);

  return messages;
}
