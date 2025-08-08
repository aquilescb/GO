import { useEffect, useRef } from 'react';
import { calculateInfluence } from '../lib/analysis/influence';
import { analyzeTerritoryAndThreats } from '../lib/analysis/territory';
import { calculatePriorityMap } from '../lib/analysis/priority';
import type { StoneMap } from '../types/game';

type AnalysisType = 'influence' | 'territory' | 'priority';

interface Props {
  type: AnalysisType;
  stones: StoneMap;
  width?: number;
  height?: number;
}

const cellSize = 17;
const margin = 12;
const boardSize = 19;

export default function AnalysisCanvas({
  type,
  stones,
  width = 330,
  height = 330
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawBoard(ctx);
    drawStones(ctx, stones);

    if (type === 'influence') drawInfluence(ctx, stones);
    if (type === 'territory') drawTerritory(ctx, stones);
    if (type === 'priority') drawPriority(ctx, stones);
  }, [type, stones]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="rounded shadow-md bg-yellow-200 border-2 border-yellow-800"
    />
  );
}

function drawBoard(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
  ctx.fillStyle = '#deb887';
  ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  ctx.strokeStyle = '#000';
  ctx.lineWidth = 1;

  for (let i = 0; i < boardSize; i++) {
    const pos = margin + i * cellSize;
    ctx.beginPath();
    ctx.moveTo(pos, margin);
    ctx.lineTo(pos, margin + (boardSize - 1) * cellSize);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(margin, pos);
    ctx.lineTo(margin + (boardSize - 1) * cellSize, pos);
    ctx.stroke();
  }
}

function drawStones(ctx: CanvasRenderingContext2D, stones: StoneMap) {
  for (const [pos, color] of Object.entries(stones)) {
    const [x, y] = pos.split(',').map(Number);
    const screenX = margin + x * cellSize;
    const screenY = margin + y * cellSize;
    const radius = cellSize * 0.4;

    ctx.fillStyle = color === 'black' ? '#000' : '#fff';
    ctx.beginPath();
    ctx.arc(screenX, screenY, radius, 0, 2 * Math.PI);
    ctx.fill();

    ctx.strokeStyle = color === 'black' ? '#333' : '#ccc';
    ctx.lineWidth = 1;
    ctx.stroke();
  }
}

function drawInfluence(ctx: CanvasRenderingContext2D, stones: StoneMap) {
  const influenceGrid = calculateInfluence(stones);

  for (const [pos, value] of Object.entries(influenceGrid)) {
    const [x, y] = pos.split(',').map(Number);
    const screenX = margin + x * cellSize;
    const screenY = margin + y * cellSize;

    let color: string | null = null;

    if (value.black > value.white + 0.1) {
      color = `rgba(255, 100, 100, ${Math.min(value.black, 0.6)})`;
    } else if (value.white > value.black + 0.1) {
      color = `rgba(100, 100, 255, ${Math.min(value.white, 0.6)})`;
    } else if (value.black > 0 && value.white > 0) {
      color = `rgba(255, 255, 100, 0.4)`;
    }

    if (color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(screenX, screenY, 8, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}

function drawTerritory(ctx: CanvasRenderingContext2D, stones: StoneMap) {
  const { territory, threats } = analyzeTerritoryAndThreats(stones);

  for (const [pos, info] of Object.entries(territory)) {
    const [x, y] = pos.split(',').map(Number);
    const screenX = margin + x * cellSize;
    const screenY = margin + y * cellSize;

    ctx.fillStyle = info.owner === 'black' ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.7)';
    ctx.fillRect(screenX - 7, screenY - 7, 14, 14);
  }

  threats.forEach(threat => {
    threat.positions.forEach(([x, y]) => {
      const screenX = margin + x * cellSize;
      const screenY = margin + y * cellSize;
      ctx.strokeStyle = '#ff0000';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(screenX, screenY, 10, 0, 2 * Math.PI);
      ctx.stroke();
    });
  });
}

function drawPriority(ctx: CanvasRenderingContext2D, stones: StoneMap) {
  const grid = calculatePriorityMap(stones);

  for (const [pos, data] of Object.entries(grid)) {
    const [x, y] = pos.split(',').map(Number);
    const screenX = margin + x * cellSize;
    const screenY = margin + y * cellSize;

    let color = '';
    let size = 8;

    if (data.criticalForBoth) {
      color = 'rgba(255, 153, 0, 0.6)'; // naranja fuerte
      size = 10;
    } else if (data.blackPriority > data.whitePriority) {
      color = 'rgba(255, 77, 77, 0.5)'; // rojo suave (negro debe responder)
    } else if (data.whitePriority > data.blackPriority) {
      color = 'rgba(77, 121, 255, 0.5)'; // azul suave (blanco debe responder)
    }

    if (color) {
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(screenX, screenY, size, 0, 2 * Math.PI);
      ctx.fill();
    }
  }
}

