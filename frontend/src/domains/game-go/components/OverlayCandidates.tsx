import type { CandidateMove } from "@/lib/types/katago";
import { coordToXY } from "@/lib/utils/coords";

interface Props {
   candidates?: CandidateMove[];
   cell: number;
}

export default function OverlayCandidates({ candidates, cell }: Props) {
   if (!candidates || candidates.length === 0) return null;
   const strokeFor = (order: number) =>
      order === 1 ? 0.6 : order === 2 ? 0.45 : 0.35;
   const dashFor = (order: number) =>
      order === 1 ? "" : order === 2 ? "3 2" : "1.5 2";

   return (
      <g aria-label="candidates">
         {candidates.map((c) => {
            const { x, y } = coordToXY(c.move);
            const cx = x * cell,
               cy = y * cell;
            return (
               <g key={`cand-${c.order}-${c.move}`}>
                  <circle
                     cx={cx}
                     cy={cy}
                     r={cell * 0.55}
                     fill="none"
                     stroke="#111"
                     strokeOpacity={0.25}
                     strokeWidth={strokeFor(c.order) + 0.2}
                  />
                  <circle
                     cx={cx}
                     cy={cy}
                     r={cell * 0.55}
                     fill="none"
                     stroke={
                        c.order === 1
                           ? "#f59e0b"
                           : c.order === 2
                           ? "#60a5fa"
                           : "#a78bfa"
                     }
                     strokeWidth={strokeFor(c.order)}
                     strokeDasharray={dashFor(c.order)}
                  />
               </g>
            );
         })}
      </g>
   );
}
