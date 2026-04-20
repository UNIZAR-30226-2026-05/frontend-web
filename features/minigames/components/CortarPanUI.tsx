"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import PixelButton from "@/components/UI/PixelButton";

interface CortarPanUIProps {
  onAction: (result: { score: number }) => void;
}

export default function CortarPanUI({ onAction }: CortarPanUIProps) {
  const pathname = usePathname();
  const isDebugRoute = pathname.includes("debug");
  const [isFinished, setIsFinished] = useState(false);
  const [knifePosition, setKnifePosition] = useState(0); // 0 to 100
  
  const [debugTraversalDuration, setDebugTraversalDuration] = useState(400);
  const [debugPanScale, setDebugPanScale] = useState(56.0);
  const [debugPanTop, setDebugPanTop] = useState(69.0);
  const [showDebug, setShowDebug] = useState(true);
  const isDebug = isDebugRoute && showDebug;

  const animationRef = useRef<number>(0);

  useEffect(() => {
    const startTime = performance.now();
    const traversalDuration = debugTraversalDuration; // 0.4s to go from one side to the other

    const animate = (time: number) => {
      if (isFinished) return;
      
      const elapsed = time - startTime;
      const cycle = Math.floor(elapsed / traversalDuration);
      const progress = (elapsed % traversalDuration) / traversalDuration;
      
      // Linear Ping-Pong: if cycle is even, go 0->100, if odd, go 100->0
      const pos = cycle % 2 === 0 ? progress * 100 : (1 - progress) * 100;
      
      setKnifePosition(pos);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
        cancelAnimationFrame(animationRef.current);
    };
  }, [debugTraversalDuration, isFinished]);

  const handleCut = () => {
    if (isFinished) return;
    
    setIsFinished(true);
    cancelAnimationFrame(animationRef.current);
    
    // Score: absolute difference from center (50) scaled by 100 (range 0-5000)
    const diff = Math.abs(50 - knifePosition);
    const score = Math.max(0, Math.min(9999, Math.floor(diff * 100)));
    
    onAction({ score });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden font-pixel flex flex-col items-center justify-center">
      
      {/* Debug Controls Overlay */}
      {isDebug && (
        <div className="absolute top-4 left-4 z-50 bg-black/80 p-4 border-2 border-amber-500 text-white text-xs flex flex-col gap-2 rounded-lg backdrop-blur-md">
          <div className="font-bold text-amber-500 mb-2 underline">PANADERO DEBUGGER</div>
          <div className="flex flex-col">
            <label>Traversal Speed: {debugTraversalDuration}ms</label>
            <input 
              type="range" min="100" max="2000" step="50" 
              value={debugTraversalDuration} onChange={(e) => setDebugTraversalDuration(parseInt(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>Pan Scale: {debugPanScale.toFixed(1)}%</label>
            <input 
              type="range" min="10" max="60" step="0.5" 
              value={debugPanScale} onChange={(e) => setDebugPanScale(parseFloat(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>Pan Top Pos: {debugPanTop.toFixed(1)}%</label>
            <input 
              type="range" min="20" max="80" step="0.5" 
              value={debugPanTop} onChange={(e) => setDebugPanTop(parseFloat(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="mt-2 p-2 bg-white/10 rounded font-mono text-[9px]">
            traversalDuration: {debugTraversalDuration},<br />
            panScale: {debugPanScale.toFixed(1)}%,<br />
            panTop: {debugPanTop.toFixed(1)}%
          </div>
          <div className="flex gap-2 mt-2">
            <button 
              onClick={() => setShowDebug(false)}
              className="flex-1 text-[10px] bg-red-500/20 hover:bg-red-500/40 py-1 rounded transition-colors"
            >
              HIDE
            </button>
          </div>
        </div>
      )}

      {/* Fondo de Mesa (Pantalla Completa) */}
      <div className="absolute inset-0 z-0">
          <Image 
              src="/minijuegos/pan/mesa.png" 
              alt="Mesa de panadería" 
              fill 
              className="object-cover"
              unoptimized
          />
          <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Área del Pan y Cuchillo */}
      <div className="relative w-full max-w-5xl aspect-video z-10 flex items-center justify-center">
        {/* Pan de Hogaza */}
        <div 
          className="absolute z-10"
          style={{ 
            width: `${debugPanScale}%`,
            height: `${debugPanScale}%`,
            top: `${debugPanTop}%`,
            left: '50%',
            transform: 'translate(-50%, -50%)'
          }}
        >
            <Image 
                src="/minijuegos/pan/pan.png" 
                alt="Pan de Hogaza" 
                fill 
                className="object-contain drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)]"
                unoptimized
            />
        </div>

        {/* Línea del Cuchillo - Efecto Laser */}
        <div 
          className="absolute top-0 bottom-0 w-1.5 bg-white shadow-[0_0_20px_#fff,0_0_40px_#fff,0_0_60px_#ef4444] z-20"
          style={{ 
            left: `${knifePosition}%`,
            transform: 'translateX(-50%)'
          }}
        />

        {/* Marcador del Centro (Guía sutil) */}
        <div className="absolute top-0 bottom-0 left-1/2 w-0.5 border-x border-amber-500/30 -translate-x-1/2 z-10" />
      </div>

      {/* Botón de Corte */}
      <div className="absolute bottom-20 z-20 flex flex-col items-center gap-6">
        <PixelButton 
          variant="red" 
          onClick={handleCut}
          disabled={isFinished}
          className="px-24 py-10 text-4xl h-28 w-80 shadow-[0_12px_0_rgb(153,27,27)] active:translate-y-1 active:shadow-none transition-all uppercase tracking-[0.2em]"
        >
          CORTAR
        </PixelButton>
      </div>
    </div>
  );
}
