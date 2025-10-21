// src/domains/game-go/components/CommentBox.tsx
export default function CommentBox({
   value,
   onChange,
   maxLen = 240,
}: {
   value: string;
   onChange: (v: string) => void;
   maxLen?: number;
}) {
   const left = maxLen - (value?.length ?? 0);
   return (
      <div className="space-y-2">
         <div className="text-sm font-medium">Comentario</div>
         <textarea
            value={value ?? ""}
            onChange={(e) => onChange(e.target.value.slice(0, maxLen))}
            placeholder="Anota por qué jugaste esto, idea táctica, lectura, etc."
            rows={3}
            className="w-full rounded-md bg-[#223243] border border-[#2a3b48] text-sm p-2 outline-none focus:ring-2 focus:ring-[#f0c23b]/40"
         />
         <div className="text-[11px] opacity-70 text-right">
            {left} caracteres
         </div>
      </div>
   );
}
