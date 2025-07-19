import { useAssistantAI } from "@/domains/game-go/hooks/useAssistantAI";
import type { Move } from "@/domains/game-go/types/game";

interface AssistantPanelProps {
  lastMoves: Move[];
  stones: Move[];
}

const AssistantPanel = ({ lastMoves, stones }: AssistantPanelProps) => {
  const { messages, response } = useAssistantAI(lastMoves, stones);

  return (
    <div className="bg-[#1C2E3F] text-white p-4 rounded-xl w-80 shadow-lg">
      <h2 className="text-xl font-bold text-yellow-400 mb-3">Asistente Virtual</h2>

      <div className="text-sm space-y-2 max-h-80 overflow-y-auto pr-1">
        {messages.map((msg, i) => (
          <p key={i} className="mb-1">{msg}</p>
        ))}
      </div>
        {response && (
          <div className="mt-4 p-3 bg-[#2D3E4E] rounded-lg space-y-1 text-xs">
            <div>📌 <strong>Intervención:</strong> {response.levelLabel}</div>
            <div>💡 <strong>Motivo:</strong> {response.reason}</div>
            <div className="pt-2 border-t border-gray-600">
              <div>🧮 <strong>Libertades:</strong> {response.evaluation.liberties}</div>
              <div>⚠️ <strong>Riesgo:</strong> {response.evaluation.riskLevel}</div>
              {response.evaluation.isAtari && <div>🚨 <strong>¡Estás en atari!</strong></div>}
              <div>
                🌍 <strong>Territorio estimado:</strong><br />
                🖤 {response.evaluation.territoryEstimate.black} / ⚪ {response.evaluation.territoryEstimate.white}
              </div>
            </div>
          </div>
        )}
      
    </div>
  );
};

export default AssistantPanel;
