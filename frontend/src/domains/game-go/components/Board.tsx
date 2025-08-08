import type { Move } from '@/domains/game-go/types/game';

interface Props {
  moves: Move[];
  onPlay: (coord: string) => void;
  botThinking: boolean;
}

const letters = 'ABCDEFGHJKLMNOPQRST';

export default function BoardSVG({ moves, onPlay, botThinking }: Props) {
  const size = 19;
  const gridSize = 100; // escala interna SVG
  const cellSize = gridSize / (size - 1);

  const handleClick = (x: number, y: number) => {
    if (botThinking) return;
    const coord = `${letters[x]}${19 - y}`;
    onPlay(coord);
  };

  return (
    <div className="w-full max-w-[360px] sm:max-w-[450px] md:max-w-[520px] lg:max-w-[650px] aspect-square">
      <svg
        viewBox={`-5 -5 ${gridSize + 10} ${gridSize + 10}`}
        className="w-full h-full bg-[#ddb77b] border-8 border-[#6E411F] rounded"
      >
        {/* Letras (eje X) */}
        {[...Array(size)].map((_, i) => {
          const x = i * cellSize;
          return (
            <text
              key={`letter-${i}`}
              x={x}
              y={-1.5}
              textAnchor="middle"
              fontSize={2}
              fill="#333"
            >
              {letters[i]}
            </text>
          );
        })}

        {/* Números (eje Y) */}
        {[...Array(size)].map((_, i) => {
          const y = i * cellSize;
          return (
            <text
              key={`number-${i}`}
              x={-2}
              y={y + 0.7}
              fontSize={2}
              fill="#333"
              textAnchor="middle"
              alignmentBaseline="middle"
            >
              {19 - i}
            </text>
          );
        })}

        {/* Líneas del tablero */}
        {[...Array(size)].map((_, i) => {
          const pos = i * cellSize;
          return (
            <g key={`line-${i}`}>
              <line
                x1={0}
                y1={pos}
                x2={gridSize}
                y2={pos}
                stroke="#333"
                strokeWidth={0.2}
              />
              <line
                x1={pos}
                y1={0}
                x2={pos}
                y2={gridSize}
                stroke="#333"
                strokeWidth={0.2}
              />
            </g>
          );
        })}

        {/* Intersecciones y piedras */}
        {[...Array(size)].map((_, y) =>
          [...Array(size)].map((_, x) => {
            const stone = moves.find(m => m.x === x && m.y === y);
            const cx = x * cellSize;
            const cy = y * cellSize;

            return (
              <g key={`${x}-${y}`} onClick={() => handleClick(x, y)} className="cursor-pointer">
                <circle cx={cx} cy={cy} r={cellSize * 0.4} fill="transparent" />
                {stone && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={cellSize * 0.3}
                    fill={stone.color === 'black' ? '#111' : 'white'}
                    stroke={stone.color === 'white' ? 'black' : 'none'}
                    strokeWidth={stone.color === 'white' ? 0.2 : 0}
                    filter={
                      stone.color === 'black'
                        ? 'drop-shadow(1px 1px 2px #0005)'
                        : 'drop-shadow(1px 1px 1px #0001)'
                    }
                  />
                )}
              </g>
            );
          })
        )}
      </svg>
    </div>
  );
}
