"use client";

import React, { useState, useEffect, useRef } from "react";
import Image from "next/image";

interface ReflejosUIProps {
  onAction: (result: { reactionTimeMs: number }) => void;
}

export default function ReflejosUI({ onAction }: ReflejosUIProps) {
  const [gameState, setGameState] = useState<"waiting" | "ready" | "clicked">("waiting");
  const [startTime, setStartTime] = useState<number>(0);
  const [reactionTime, setReactionTime] = useState<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Generar un delay aleatorio entre 2 y 5 segundos
    const randomDelay = Math.floor(Math.random() * 3000) + 2000;
    
    timerRef.current = setTimeout(() => {
      setGameState("ready");
      setStartTime(performance.now());
    }, randomDelay);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const handleClick = () => {
    if (gameState === "waiting") {
      if (timerRef.current) clearTimeout(timerRef.current);
      setGameState("clicked");
      setReactionTime(9999);
      onAction({ reactionTimeMs: 9999 });
      return;
    }

    if (gameState === "ready") {
      const endTime = performance.now();
      const timeTaken = Math.round(endTime - startTime);
      setGameState("clicked");
      setReactionTime(timeTaken);
      onAction({ reactionTimeMs: timeTaken });
    }
  };

  return (
    <div className="relative flex flex-col items-center justify-center w-full h-full font-pixel overflow-hidden  shadow-2xl">
      {/* Fondo Reflejos */}
      <div className="absolute inset-0 z-0">
        <Image 
          src="/minijuegos/reflejos/reflejos.png" 
          alt="Campo de Entrenamiento" 
          fill 
          className="object-contain"
          unoptimized
        />
      </div>

      {/* Rectángulo de Reacción (Posicionado sobre el tablero central) */}
      <div className="relative z-10 w-full max-w-4xl aspect-[16/10.8]">
        <div 
          className={`absolute w-72 h-44 md:w-[515px] md:h-[280px]  flex items-center justify-center transition-all duration-150 active:scale-95
            ${gameState === "waiting" ? "bg-red-600/90" : 
              gameState === "ready" ? "bg-green-500/90" : 
              "bg-slate-700/80 shadow-none grayscale opacity-60"}`}
          style={{ 
            left: '50%', 
            top: '40%', 
            transform: 'translate(-50%, -50%)' 
          }}
        >
          <button 
            onClick={handleClick}
            disabled={gameState === "clicked"}
            className="w-full h-full flex flex-col items-center justify-center text-white text-2xl md:text-4xl font-bold tracking-widest uppercase outline-none"
          >
            {gameState === "waiting" && "¡LISTO!"}
            {gameState === "ready" && "¡YA!"}
            {gameState === "clicked" && (
              <div className="flex flex-col items-center animate-in zoom-in duration-300">
                <span className="text-xl md:text-3xl">
                  {reactionTime === 9999 ? "¡ERROR!" : `${reactionTime}ms`}
                </span>
              </div>
            )}
          </button>
        </div>
      </div>

      <div className="absolute bottom-6 left-0 right-0 z-20 text-center">
        <p className="inline-block bg-black/60 px-6 py-2 border border-white/20 text-white/80 text-xs md:text-sm tracking-widest uppercase">
          Reacciona en cuanto cambie el color
        </p>
      </div>
    </div>
  );
}
