"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import PixelButton from "@/components/UI/PixelButton";

interface DilemaPrisioneroUIProps {
  onAction: (result: { score: number }) => void;
}

import Image from "next/image";

export default function DilemaPrisioneroUI({ onAction }: DilemaPrisioneroUIProps) {
  const pathname = usePathname();
  const isDebugRoute = pathname.includes("debug");
  const [debugButW, setDebugButW] = useState(256);
  const [debugButH, setDebugButH] = useState(112);
  const [debugButTop, setDebugButTop] = useState(86);
  const [debugSideGap, setDebugSideGap] = useState(23);
  const [showDebug, setShowDebug] = useState(true);
  const isDebug = isDebugRoute && showDebug;

  const handleChoice = (choice: "cooperar" | "traicionar") => {
    const score = choice === "cooperar" ? 1 : 0;
    onAction({ score });
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden font-pixel flex flex-col items-center justify-center">
      
      {/* Debug Controls Overlay */}
      {isDebug && (
        <div className="absolute top-4 left-4 z-50 bg-black/80 p-4 border-2 border-amber-500 text-white text-xs flex flex-col gap-2 rounded-lg backdrop-blur-md">
          <div className="font-bold text-amber-500 mb-2 underline">PRISONER DEBUGGER</div>
          <div className="flex flex-col">
            <label>Button Width: {debugButW}px</label>
            <input 
              type="range" min="100" max="500" step="4" 
              value={debugButW} onChange={(e) => setDebugButW(parseInt(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>Button Height: {debugButH}px</label>
            <input 
              type="range" min="50" max="300" step="4" 
              value={debugButH} onChange={(e) => setDebugButH(parseInt(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>Button Top Pos: {debugButTop}%</label>
            <input 
              type="range" min="10" max="90" step="1" 
              value={debugButTop} onChange={(e) => setDebugButTop(parseInt(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>Side Gap: {debugSideGap}%</label>
            <input 
              type="range" min="0" max="40" step="1" 
              value={debugSideGap} onChange={(e) => setDebugSideGap(parseInt(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="mt-2 p-2 bg-white/10 rounded font-mono text-[9px]">
            width: {debugButW},<br />
            height: {debugButH},<br />
            top: {debugButTop}%,<br />
            sideGap: {debugSideGap}%
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

      {/* Fondo Interrogatorio (Pantalla Completa) */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/minijuegos/prisionero/interrogatorio.png" 
          alt="Sala de interrogatorio" 
          fill 
          className="object-cover"
          unoptimized
        />
        {/* Overlay sutil para profundidad */}
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Texto Central Dorado (Top) */}
      <div className="absolute top-24 z-20 text-center px-4">
        <h3 className="text-amber-400 text-4xl md:text-6xl font-bold tracking-[0.1em] drop-shadow-[0_4px_8px_rgba(0,0,0,0.9)] uppercase">
          ¿COOPERAR O TRAICIONAR?
        </h3>
        <p className="text-white/60 text-lg md:text-xl mt-4 uppercase tracking-[0.4em] drop-shadow-md">
          El destino de ambos está en tus manos
        </p>
      </div>

      {/* Botones de Decisión (Posicionados sobre las "mesas") */}
      <div className="relative z-10 w-full h-full pointer-events-none">
        
        {/* Traicionar (Izquierda) */}
        <div 
          className="absolute -translate-y-1/2 pointer-events-auto"
          style={{ left: `${debugSideGap}%`, top: `${debugButTop}%` }}
        >
          <div className="flex flex-col items-center gap-6">
            <PixelButton 
              variant="red" 
              onClick={() => handleChoice("traicionar")}
              style={{ width: `${debugButW}px`, height: `${debugButH}px` }}
              className="text-3xl md:text-4xl shadow-[0_12px_0_rgb(153,27,27)] hover:scale-105 active:translate-y-1 active:shadow-none transition-all uppercase"
            >
              TRAICIONAR
            </PixelButton>
            <span className="text-red-500 bg-black/60 px-4 py-1 text-sm tracking-widest uppercase border border-red-500/30">
              SOLO YO
            </span>
          </div>
        </div>

        {/* Cooperar (Derecha) */}
        <div 
          className="absolute -translate-y-1/2 pointer-events-auto"
          style={{ right: `${debugSideGap}%`, top: `${debugButTop}%` }}
        >
          <div className="flex flex-col items-center gap-6">
            <PixelButton 
              variant="green" 
              onClick={() => handleChoice("cooperar")}
              style={{ width: `${debugButW}px`, height: `${debugButH}px` }}
              className="text-3xl md:text-4xl shadow-[0_12px_0_rgb(22,101,52)] hover:scale-105 active:translate-y-1 active:shadow-none transition-all uppercase"
            >
              COOPERAR
            </PixelButton>
            <span className="text-green-500 bg-black/60 px-4 py-1 text-sm tracking-widest uppercase border border-green-500/30">
              NOSOTROS
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
