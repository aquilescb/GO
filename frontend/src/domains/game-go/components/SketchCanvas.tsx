import { useEffect, useRef, useState } from "react";

export default function SketchCanvas({
   ratio = 1, // alto = ancho * ratio; 1 = cuadrado
}: {
   ratio?: number;
}) {
   const wrapperRef = useRef<HTMLDivElement | null>(null);
   const canvasRef = useRef<HTMLCanvasElement | null>(null);
   const [drawing, setDrawing] = useState(false);
   const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);

   // Resize canvas to wrapper width
   const resize = () => {
      const el = wrapperRef.current;
      const canvas = canvasRef.current;
      if (!el || !canvas) return;
      const w = Math.floor(el.clientWidth);
      const h = Math.floor(w * ratio);
      // set canvas bitmap size
      canvas.width = w;
      canvas.height = h;
      // set css size
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
   };

   useEffect(() => {
      resize();
      const ro = new ResizeObserver(() => resize());
      if (wrapperRef.current) ro.observe(wrapperRef.current);
      return () => ro.disconnect();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, []);

   useEffect(() => {
      if (!canvasRef.current) return;
      const c = canvasRef.current.getContext("2d");
      if (!c) return;
      c.lineWidth = 2.2;
      c.lineJoin = "round";
      c.lineCap = "round";
      c.strokeStyle = "#f0c23b";
      setCtx(c);
   }, []);

   const getPos = (e: React.MouseEvent<HTMLCanvasElement, MouseEvent>) => {
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
   };

   const onDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!ctx) return;
      const { x, y } = getPos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
      setDrawing(true);
   };
   const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!ctx || !drawing) return;
      const { x, y } = getPos(e);
      ctx.lineTo(x, y);
      ctx.stroke();
   };
   const onUp = () => setDrawing(false);

   const clear = () => {
      if (!ctx || !canvasRef.current) return;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
   };

   return (
      <div className="space-y-2">
         <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Lápiz</span>
            <button
               onClick={clear}
               className="px-2 py-1 rounded bg-[#2a3b48] hover:bg-[#34485a] text-xs"
            >
               Limpiar
            </button>
         </div>

         <div ref={wrapperRef} className="w-full">
            <canvas
               ref={canvasRef}
               className="rounded border border-[#2a3b48] bg-transparent block w-full"
               onMouseDown={onDown}
               onMouseMove={onMove}
               onMouseUp={onUp}
               onMouseLeave={onUp}
            />
         </div>
      </div>
   );
}
