import { useEffect, useState, useRef } from "react";
import type { Move } from "@/types/game";

export function useAssistantAI(
  lastMove: Move | null,
  stones: Move[]
) {
  const [messages, setMessages] = useState<string[]>([
    "¡Hola! Soy tu asistente virtual de GO 🤖",
    "¿Listo para una buena partida?",
  ]);

  const lastMoveRef = useRef<string | null>(null);

  useEffect(() => {
    if (!lastMove || lastMove.color !== "black") return;
    const moveKey = `${lastMove.x}-${lastMove.y}`;
    if (lastMoveRef.current === moveKey) return;

    lastMoveRef.current = moveKey;

    const fetchComentario = async () => {
      const boardSize = 19;
      const board: ("black" | "white" | null)[][] = Array.from(
        { length: boardSize },
        () => Array(boardSize).fill(null)
      );

      for (const stone of stones) {
        board[stone.x][stone.y] = stone.color;
      }

      try {
        const res = await fetch("http://localhost:3000/assistant/analizar", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            board,
            lastMove
          }),
        });

        const comentario = await res.text();
        setMessages((prev) => [...prev, `🧠 ${comentario}`]);
      } catch (error) {
        console.error("Error al obtener comentario del asistente:", error);
      }
    };

    fetchComentario();
  }, [lastMove]);

  return messages;
}
