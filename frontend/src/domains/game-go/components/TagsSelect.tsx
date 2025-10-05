// src/domains/game-go/components/TagsSelect.tsx
const PRESET = [
   "Apertura",
   "Juseki",
   "Joseki",
   "Ataque",
   "Defensa",
   "Vida y muerte",
   "Semeai",
   "Sente",
   "Gote",
   "Ko",
];

export default function TagsSelect({
   value,
   onChange,
}: {
   value: string[];
   onChange: (v: string[]) => void;
}) {
   const toggle = (t: string) =>
      onChange(
         value.includes(t) ? value.filter((x) => x !== t) : [...value, t]
      );

   return (
      <div className="space-y-2">
         <div className="text-sm font-medium">Etiquetas</div>
         <div className="flex flex-wrap gap-2">
            {PRESET.map((t) => {
               const active = value.includes(t);
               return (
                  <button
                     key={t}
                     onClick={() => toggle(t)}
                     className={`px-2 py-1 rounded-md border text-xs
                ${
                   active
                      ? "bg-[#f0c23b] text-black border-[#f0c23b]"
                      : "bg-[#223243] border-[#2a3b48] text-gray-200"
                }
              `}
                  >
                     {t}
                  </button>
               );
            })}
         </div>
         {value.length > 0 && (
            <div className="text-xs opacity-80">
               Seleccionadas: {value.join(", ")}
            </div>
         )}
      </div>
   );
}
