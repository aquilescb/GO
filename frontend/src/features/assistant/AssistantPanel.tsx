import { useAssistantAI } from "./AssistantLogic";

interface Props {
  lastMove: { x: number; y: number } | null;
}

const AssistantPanel = ({ lastMove }: Props) => {
  const messages = useAssistantAI(lastMove);

  return (
    <div className="bg-[#1f2937] p-4 rounded-lg w-80 border border-gray-700">
      <h2 className="text-xl font-bold text-yellow-400 mb-2">Asistente Virtual</h2>
      <div className="flex flex-col gap-2 text-sm">
        {lastMove && (
          <p className="text-gray-300">
            Última jugada en ({lastMove.x + 1}, {lastMove.y + 1})
          </p>
        )}
        {messages.map((msg, index) => (
          <div
            key={index}
            className="bg-[#374151] p-2 rounded-lg flex items-center gap-2"
          >
            {msg.startsWith("🧠") && <span className="text-pink-400">🧠</span>}
            <span>{msg.replace("🧠 ", "")}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AssistantPanel;
