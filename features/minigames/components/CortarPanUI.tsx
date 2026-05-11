"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import PixelButton from "@/components/UI/PixelButton";

interface CortarPanUIProps {
  onAction: (result: { score: number; objetivo?: number }) => void;
}

export default function CortarPanUI({ onAction }: CortarPanUIProps) {
  const pathname = usePathname();
  const isDebugRoute = pathname.includes("debug");
  const [isFinished, setIsFinished] = useState(false);
  const [cutPosition, setCutPosition] = useState<number | null>(null);
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
    setCutPosition(knifePosition);
    cancelAnimationFrame(animationRef.current);
    
    // Esperar 1.5s para que el jugador vea dónde cortó
    setTimeout(() => {
      onAction({ score: Math.round(knifePosition), objetivo: 50 });
    }, 1500);
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
          <div className="mt-2 p-2 bg-white/10 rounded font-pixel text-[9px]">
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
      {(() => {
        // Boundaries del pan: centrado al 50% con ancho debugPanScale%
        const panLeft = 50 - debugPanScale / 2;
        const panRight = 50 + debugPanScale / 2;
        // Mapear knifePosition (0-100) al rango horizontal del pan
        const mappedKnife = panLeft + (knifePosition / 100) * (panRight - panLeft);
        const mappedCut = cutPosition !== null ? panLeft + (cutPosition / 100) * (panRight - panLeft) : null;

        return (
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

        {/* Línea del Cuchillo (en movimiento: sólida blanca con glow) */}
        {!isFinished && (
          <div 
            className="absolute w-1 bg-white z-20"
            style={{ 
              top: '25%',
              bottom: '0%',
              left: `${mappedKnife}%`,
              transform: 'translateX(-50%)',
              boxShadow: '0 0 10px #fff, 0 0 20px #fff, 0 0 40px rgba(255,255,255,0.5)'
            }}
          />
        )}

        {/* Línea de corte fija (después de cortar) */}
        {cutPosition !== null && (
          <div 
            className="absolute w-1 bg-white z-20 animate-pulse"
            style={{ 
              top: '25%',
              bottom: '0%',
              left: `${mappedCut}%`,
              transform: 'translateX(-50%)',
              boxShadow: '0 0 10px #fff, 0 0 20px #fff, 0 0 40px rgba(255,255,255,0.5)'
            }}
          />
        )}

        {/* Marcador del Centro (guía: puntos blancos, solo zona del pan) */}
        <div 
          className="absolute left-1/2 z-10"
          style={{
            top: '35%',
            bottom: '5%',
            transform: 'translateX(-50%)',
            width: '6px',
            borderLeft: '6px dotted rgba(255,255,255,0.8)'
          }}
        />
      </div>
        );
      })()}

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
