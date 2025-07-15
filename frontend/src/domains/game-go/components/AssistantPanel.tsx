import { useAssistantAI } from "@/domains/game-go/hooks/useAssistantAI";
import type { Move } from "@/domains/game-go/types/game";

interface AssistantPanelProps {
  lastMoves: Move[];
  stones: Move[];
}

const AssistantPanel = ({ lastMoves, stones }: AssistantPanelProps) => {
  const messages = useAssistantAI(lastMoves, stones);

  return (
    <div className="bg-[#1C2E3F] text-white p-4 rounded-xl w-80 shadow-lg">
      <h2 className="text-xl font-bold text-yellow-400 mb-3">Asistente Virtual</h2>
      <div className="text-sm space-y-2 max-h-80 overflow-y-auto pr-1">
              {messages.map((msg, i) => (
        <p key={i} className="mb-1">{msg}</p>
      ))}
      </div>
    </div>
  );
};

export default AssistantPanel;
