"use client";

import React, { useState, useRef, useEffect } from "react";
import Image from "next/image";
import PixelButton from "@/components/UI/PixelButton";

interface CortarPanUIProps {
  onAction: (result: { precision: number }) => void;
}

export default function CortarPanUI({ onAction }: CortarPanUIProps) {
  const [isFinished, setIsFinished] = useState(false);
  const [knifePosition, setKnifePosition] = useState(0); // 0 to 100
  const [precision, setPrecision] = useState<number | null>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    startTimeRef.current = performance.now();
    const animate = (time: number) => {
      if (isFinished) return;
      
      // Movimiento de vaivén (ping-pong)
      const duration = 1500; // 1.5 segundos para ida y vuelta
      const progress = (time % duration) / duration;
      const pos = Math.abs(Math.sin(progress * Math.PI)) * 100;
      
      setKnifePosition(pos);
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationRef.current);
  }, [isFinished]);

  const handleCut = () => {
    if (isFinished) return;
    
    setIsFinished(true);
    cancelAnimationFrame(animationRef.current);
    
    // La precisión es qué tan cerca está de 50 (el centro)
    const diff = Math.abs(50 - knifePosition);
    const score = Math.max(0, Math.round(100 - (diff * 2)));
    setPrecision(score);
    onAction({ precision: score });
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-8 font-pixel">
      <div className="relative w-full max-w-lg h-60 bg-amber-100/5 rounded-2xl border-4 border-white/20 flex items-center justify-center overflow-hidden">
        {/* Fondo de Mesa */}
        <div className="absolute inset-0 z-0">
            <Image 
                src="/minijuegos/pan/mesa.png" 
                alt="Mesa" 
                fill 
                className="object-cover opacity-60"
                unoptimized
            />
        </div>

        {/* Pan de Hogaza (Imagen) - Ajustado a la mesa */}
        <div 
          className="absolute z-10 transition-transform duration-300"
          style={{ 
            width: '37%', 
            height: '30%',
            top: '52%',
            left: '50%',
            transform: 'translateX(-50%)'
          }}
        >
            <Image 
                src="/minijuegos/pan/pan.png" 
                alt="Pan de Hogaza" 
                fill 
                className="object-contain drop-shadow-[0_8px_8px_rgba(0,0,0,0.4)]"
                unoptimized
            />
        </div>

        {/* Línea del Cuchillo */}
        <div 
          className="absolute top-0 bottom-0 w-2 bg-white/80 shadow-[0_0_15px_white] z-20 transition-transform duration-[16ms] linear"
          style={{ 
            left: `${knifePosition}%`,
            transform: 'translateX(-50%)'
          }}
        />

        {/* Marcador del Centro */}
        <div className="absolute top-0 bottom-0 left-1/2 w-1 border-x border-red-500/30 -translate-x-1/2" />
      </div>

      <div className="flex flex-col items-center gap-6">
        <div className="flex flex-col items-center">
            <p className="text-white text-lg tracking-widest uppercase mb-2">
                ¡Corta por la mitad!
            </p>
            {isFinished && precision !== null && (
                <div className="animate-in zoom-in-50 duration-300 flex flex-col items-center">
                    <span className="text-amber-400 text-3xl font-bold">
                        PRECISIÓN: {precision}%
                    </span>
                </div>
            )}
        </div>

        <PixelButton 
          variant="red" 
          onClick={handleCut}
          disabled={isFinished}
          className="px-12 py-6 text-xl h-20 w-48"
        >
          CORTAR
        </PixelButton>
      </div>

      <p className="text-white/40 text-xs uppercase tracking-widest">
        Dificultad: Media • Velocidad: Normal
      </p>
    </div>
  );
}
