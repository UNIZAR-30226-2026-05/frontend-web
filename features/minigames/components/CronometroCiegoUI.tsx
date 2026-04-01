"use client";

import React, { useState, useEffect, useRef } from "react";
import PixelButton from "@/components/UI/PixelButton";

import Image from "next/image";

interface CronometroCiegoUIProps {
  onAction: (result: { stoppingPoint: number }) => void;
}

export default function CronometroCiegoUI({ onAction }: CronometroCiegoUIProps) {
  const [time, setTime] = useState(0); // milisegundos
  const [isRunning, setIsRunning] = useState(true);
  const [isBlinded, setIsBlinded] = useState(false);
  const [isFinished, setIsFinished] = useState(false);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number>(0);

  useEffect(() => {
    if (startTimeRef.current === 0) {
      startTimeRef.current = performance.now();
    }
    
    const tick = () => {
      if (!isRunning) return;
      
      const now = performance.now();
      const elapsed = now - startTimeRef.current;
      setTime(elapsed / 1000);
      
      // Activar persiana ciega a los 3 segundos
      if (elapsed >= 3000 && !isBlinded) {
        setIsBlinded(true);
      }
      
      timerRef.current = requestAnimationFrame(tick);
    };

    timerRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(timerRef.current);
  }, [isRunning, isBlinded]);

  const handleStop = () => {
    if (!isRunning || isFinished) return;
    
    setIsRunning(false);
    setIsFinished(true);
    cancelAnimationFrame(timerRef.current);
    
    onAction({ stoppingPoint: Math.round(time * 100) / 100 });
  };

  const formatTime = (t: number) => {
    return t.toFixed(2).padStart(5, "0");
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-8 font-pixel">
      <div className="relative w-full max-w-4xl aspect-[16/9] bg-black flex items-center justify-center border-4 border-white/10 rounded-xl shadow-2xl overflow-hidden">
        {/* Fondo Almacén (Búnker) */}
        <div className="absolute inset-0 z-0">
            <Image 
                src="/minijuegos/cronometro/almacen_cronometro.png" 
                alt="Almacén" 
                fill 
                className="object-cover"
                unoptimized
            />
        </div>

        {/* Contenedor del Temporizador (Centrado en la apertura del búnker) */}
        <div 
          className="absolute z-10 flex items-center justify-center overflow-hidden"
          style={{ 
            left: '31.5%', 
            right: '31.5%', 
            top: '40.5%', 
            height: '36.5%',
            backgroundColor: 'rgba(0,0,0,0.6)'
          }}
        >
          {/* Reloj Digital */}
          <div className="text-4xl md:text-6xl lg:text-7xl font-mono text-green-400 tracking-tighter font-bold drop-shadow-[0_0_10px_rgba(74,222,128,0.8)]">
            {formatTime(time)}
          </div>

          {/* Puerta para ocultar el reloj */}
          <div 
            className={`absolute inset-0 z-20 transition-transform duration-700 ease-in-out
              ${isBlinded ? "translate-y-0" : "-translate-y-full"}`}
          >
            <Image 
              src="/minijuegos/cronometro/puerta.png" 
              alt="Puerta de seguridad" 
              fill 
              className="object-fill"
              unoptimized
            />
          </div>
        </div>
      </div>

      <div className="flex flex-col items-center gap-4">
        <p className="text-white text-lg tracking-widest text-center uppercase">
          {isBlinded ? "¡CONFÍA EN TU INSTINTO!" : "¡PARA EL CRONO EN 10:00!"}
        </p>

        {isFinished && (
            <div className="animate-in fade-in zoom-in duration-500 text-center">
                <span className="text-3xl text-amber-500 font-bold tracking-widest">
                    HAS PARADO EN {formatTime(time)}s
                </span>
            </div>
        )}

        <PixelButton 
          variant="purple" 
          onClick={handleStop}
          disabled={isFinished}
          className="px-12 py-6 text-xl h-20 w-48"
        >
          PARAR
        </PixelButton>
      </div>

      <p className="text-white/20 text-xs text-center uppercase leading-relaxed max-w-xs">
        Se ocultará a los 3 segundos. ¡Ajusta tu cronómetro mental!
      </p>
    </div>
  );
}
