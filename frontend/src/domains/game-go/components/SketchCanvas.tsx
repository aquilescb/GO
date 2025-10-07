import { useEffect, useRef, useState } from "react";

type Props = {
   ratio?: number; // alto = ancho * ratio
   active?: boolean; // recibe eventos solo si está activo
   attachRef?: React.RefObject<HTMLElement>; // se ajusta al tamaño del tablero
   version?: number; // cambia para limpiar
};

export default function SketchCanvas({
   ratio = 1,
   active = false,
   attachRef,
   version = 0,
}: Props) {
   const localWrapperRef = useRef<HTMLDivElement | null>(null);
   const wrapperRef = attachRef ?? localWrapperRef; // si no pasan ref, usa propio
   const canvasRef = useRef<HTMLCanvasElement | null>(null);

   const [ctx, setCtx] = useState<CanvasRenderingContext2D | null>(null);
   const [drawing, setDrawing] = useState(false);

   // Ajustar canvas al wrapper (tablero)
   const resize = () => {
      const el = wrapperRef.current as HTMLElement | null;
      const canvas = canvasRef.current;
      if (!el || !canvas) return;

      const w = Math.floor(el.clientWidth);
      const h = Math.floor(w * ratio);

      canvas.width = w;
      canvas.height = h;
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
   };

   useEffect(() => {
      resize();
      const el = wrapperRef.current;
      if (!el) return;
      const ro = new ResizeObserver(() => resize());
      ro.observe(el);
      return () => ro.disconnect();
      // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [wrapperRef.current]);

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

   // Limpiar cuando cambia "version"
   useEffect(() => {
      if (!ctx || !canvasRef.current) return;
      ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
   }, [version, ctx]);

   // Usamos Pointer Events (mouse + touch)
   const getPos = (e: React.PointerEvent<HTMLCanvasElement>) => {
      const rect = (e.target as HTMLCanvasElement).getBoundingClientRect();
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
   };

   const onDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!ctx || !active) return;
      (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
      const { x, y } = getPos(e);
      ctx.beginPath();
      ctx.moveTo(x, y);
      setDrawing(true);
   };

   const onMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
      if (!ctx || !drawing || !active) return;
      const { x, y } = getPos(e);
      ctx.lineTo(x, y);
      ctx.stroke();
   };

   const onUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
      setDrawing(false);
      try {
         (e.target as HTMLCanvasElement).releasePointerCapture(e.pointerId);
      } catch {}
   };

   return (
      // Si no recibimos attachRef, usamos un wrapper propio (por compat)
      <>
         {!attachRef && (
            <div ref={localWrapperRef} className="relative w-full">
               <div className="absolute inset-0" />
            </div>
         )}

         {/* Overlay absoluto sobre el tablero */}
         <div
            className={`absolute inset-0 ${
               active ? "pointer-events-auto" : "pointer-events-none"
            }`}
            style={{ zIndex: 20, cursor: active ? "crosshair" : "default" }}
         >
            <canvas
               ref={canvasRef}
               className="block w-full h-full bg-transparent"
               onPointerDown={onDown}
               onPointerMove={onMove}
               onPointerUp={onUp}
               onPointerCancel={onUp}
               onPointerLeave={onUp}
            />
         </div>
      </>
   );
}
