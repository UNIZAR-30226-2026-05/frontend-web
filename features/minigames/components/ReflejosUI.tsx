"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface ReflejosUIProps {
  onAction: (result: { score: number }) => void;
}

export default function ReflejosUI({ onAction }: ReflejosUIProps) {
  const [gameState, setGameState] = useState<"waiting" | "ready" | "clicked">("waiting");
  const [startTime, setStartTime] = useState<number>(0);
  const [showInstructions, setShowInstructions] = useState(true);
  
  const [debugMinDelay, setDebugMinDelay] = useState(2000);
  const [debugMaxDelay, setDebugMaxDelay] = useState(5000);
  const [debugButW, setDebugButW] = useState(1185);
  const [debugButH, setDebugButH] = useState(650);
  const [debugButTop, setDebugButTop] = useState(27.5);
  const [debugButLeft, setDebugButLeft] = useState(50.0);
  const [debugCharTop, setDebugCharTop] = useState(31);
  const [isDebug, setIsDebug] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Activar debug si estamos en la ruta de debug
    if (typeof window !== "undefined" && window.location.pathname.includes("debug")) {
      setIsDebug(true);
    }
  }, []);

  useEffect(() => {
    // Generar un delay aleatorio entre debugMin y debugMax
    const range = debugMaxDelay - debugMinDelay;
    const randomDelay = Math.floor(Math.random() * range) + debugMinDelay;
    
    timerRef.current = setTimeout(() => {
      setGameState("ready");
      setStartTime(performance.now());
    }, randomDelay);

    // Timer para instrucciones (1 segundo)
    const instrTimer = setTimeout(() => {
      setShowInstructions(false);
    }, 1000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      clearTimeout(instrTimer);
    };
  }, [debugMinDelay, debugMaxDelay]);

  const handleClick = () => {
    if (gameState === "waiting") {
      if (timerRef.current) clearTimeout(timerRef.current);
      setGameState("clicked");
      onAction({ score: 9999 });
      return;
    }

    if (gameState === "ready") {
      const endTime = performance.now();
      const timeTaken = Math.max(0, Math.min(9999, Math.floor(endTime - startTime)));
      setGameState("clicked");
      onAction({ score: timeTaken });
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full font-pixel overflow-hidden">
      
      {/* Debug Controls Overlay */}
      {isDebug && (
        <div className="absolute top-4 left-4 z-50 bg-black/80 p-4 border-2 border-amber-500 text-white text-xs flex flex-col gap-2 rounded-lg backdrop-blur-md">
          <div className="font-bold text-amber-500 mb-2 underline">REFLEX DEBUGGER</div>
          <div className="flex flex-col">
            <label>Min Delay: {debugMinDelay}ms</label>
            <input 
              type="range" min="100" max="5000" step="100" 
              value={debugMinDelay} onChange={(e) => setDebugMinDelay(parseInt(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>Max Delay: {debugMaxDelay}ms</label>
            <input 
              type="range" min="500" max="10000" step="100" 
              value={debugMaxDelay} onChange={(e) => setDebugMaxDelay(parseInt(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>Button Width: {debugButW}px</label>
            <input 
              type="range" min="100" max="1500" step="5" 
              value={debugButW} onChange={(e) => setDebugButW(parseInt(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>Button Height: {debugButH}px</label>
            <input 
              type="range" min="100" max="1000" step="5" 
              value={debugButH} onChange={(e) => setDebugButH(parseInt(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>Button Top: {debugButTop}%</label>
            <input 
              type="range" min="0" max="100" step="0.5" 
              value={debugButTop} onChange={(e) => setDebugButTop(parseFloat(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>Button Left: {debugButLeft}%</label>
            <input 
              type="range" min="0" max="100" step="0.5" 
              value={debugButLeft} onChange={(e) => setDebugButLeft(parseFloat(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="mt-2 p-2 bg-white/10 rounded font-mono text-[9px]">
            minDelay: {debugMinDelay},<br/>
            maxDelay: {debugMaxDelay},<br/>
            width: {debugButW},<br/>
            height: {debugButH},<br/>
            top: "{debugButTop.toFixed(1)}%",<br/>
            left: "{debugButLeft.toFixed(1)}%",<br/>
            charTop: "{debugCharTop}%"
          </div>
          <div className="flex flex-col">
            <label>Chars Top: {debugCharTop}%</label>
            <input 
              type="range" min="0" max="100" step="1" 
              value={debugCharTop} onChange={(e) => setDebugCharTop(parseInt(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button 
              onClick={() => setIsDebug(false)}
              className="flex-1 text-[10px] bg-red-500/20 hover:bg-red-500/40 py-1 rounded transition-colors"
            >
              HIDE
            </button>
          </div>
        </div>
      )}

      {/* Fondo Reflejos */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/minijuegos/reflejos/reflejos.png" 
          alt="Campo de Entrenamiento" 
          fill 
          className="object-cover"
          unoptimized
        />
      </div>

      {/* Personajes de Espalda */}
      <div 
        className="absolute w-full h-[60%] z-20 pointer-events-none"
        style={{ 
          top: `${debugCharTop}%`,
          left: '50%',
          transform: 'translateX(-50%)'
        }}
      >
        <Image 
          src="/minijuegos/personajes_espalda_minijuego.png" 
          alt="Personajes de espalda" 
          fill 
          className="object-contain object-bottom"
          unoptimized
        />
      </div>

      {/* Rectángulo de Reacción (Posicionado sobre el tablero central) */}
      <div className="relative z-10 w-full max-w-4xl aspect-[16/10.8]">
        <div 
          className={`absolute flex items-center justify-center transition-all duration-150 shadow-2xl
            ${gameState === "waiting" ? "bg-[#CA0E0B]" : 
              gameState === "ready" ? "bg-[#0BDA73]" : 
              "bg-[#3079EF]"}`}
          style={{ 
            left: `${debugButLeft}%`, 
            top: `${debugButTop}%`, 
            width: `${debugButW}px`,
            height: `${debugButH}px`,
            transform: 'translate(-50%, -50%)' 
          }}
        >
          <button 
            onClick={handleClick}
            disabled={gameState === "clicked"}
            className="w-full h-full flex flex-col items-center justify-center text-white text-4xl md:text-6xl font-bold tracking-[0.2em] uppercase outline-none"
          >
            {gameState === "waiting" && "¡LISTO!"}
            {gameState === "ready" && "¡YA!"}
            {gameState === "clicked" && "OK"}
          </button>
        </div>
      </div>

      {showInstructions && (
        <div className="absolute bottom-12 left-0 right-0 z-20 text-center animate-out fade-out duration-500 fill-mode-forwards" style={{ animationDelay: '800ms' }}>
          <p className="inline-block bg-black/80 px-8 py-3 border-2 border-amber-500/30 text-white text-sm md:text-lg tracking-[0.2em] uppercase">
            Reacciona en cuanto cambie el color
          </p>
        </div>
      )}
    </div>
  );
}
