"use client";

import React, { useState, useEffect } from "react";
import PixelButton from "@/components/UI/PixelButton";
import PixelInput from "@/components/UI/PixelInput";
import Image from "next/image";

interface TrenUIProps {
  onAction: (result: { count: number }) => void;
}

const CHARACTERS = [
  "/personajes_profile/banquero_profile.png",
  "/personajes_profile/escapista_profile.png",
  "/personajes_profile/vidente_profile.png",
  "/personajes_profile/videojugador_profile.png"
];

// Centros de las ventanas en % de ancho del vagón
const WINDOW_X_CENTERS = [11.0, 19.5, 28.0, 36.5, 45.0, 53.5, 62.0, 70.5, 79.0, 87.5];
const WINDOW_Y_TOP = "39%"; // 45% center - half passenger height (approx 6%) 

export default function TrenUI({ onAction }: TrenUIProps) {
  const [inputValue, setInputValue] = useState("");
  const [isFinished, setIsFinished] = useState(false);
  const [wagonCount, setWagonCount] = useState<number>(0);
  const [passengers, setPassengers] = useState<{ wagonIndex: number, windowIndex: number, charImg: string }[]>([]);
  const [totalCharacters, setTotalCharacters] = useState(0);

  useEffect(() => {
    // Generar un número aleatorio de vagones entre 3 y 5 (para que no sea eterno)
    const wCount = Math.floor(Math.random() * 3) + 3;
    setWagonCount(wCount);
    
    // Generar pasajeros aleatorios
    const pCount = Math.floor(Math.random() * 6) + 4; // Entre 4 y 10 personajes
    setTotalCharacters(pCount);
    
    const newPassengers = [];
    const usedSlots = new Set();
    
    while (newPassengers.length < pCount) {
      const wagonIndex = Math.floor(Math.random() * wCount);
      const windowIndex = Math.floor(Math.random() * WINDOW_X_CENTERS.length);
      const slotId = `${wagonIndex}-${windowIndex}`;
      
      if (!usedSlots.has(slotId)) {
        usedSlots.add(slotId);
        newPassengers.push({
          wagonIndex,
          windowIndex,
          charImg: CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)]
        });
      }
    }
    setPassengers(newPassengers);
  }, []);

  const handleSubmit = () => {
    const value = parseInt(inputValue);
    if (!isNaN(value)) {
      setIsFinished(true);
      onAction({ count: value });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-12 font-pixel">
      {/* Vía del Tren */}
      <div className="relative w-full h-[400px] bg-[#0f172a] border-y-8 border-slate-700 overflow-hidden flex items-center shadow-2xl">
        {/* Fondo de Vías (Estático) */}
        <div 
          className="absolute inset-0 z-0"
          style={{ 
            backgroundImage: "url('/minijuegos/tren/vias.png')", 
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat'
          }} 
        />
        
        {/* Contenedor de Tren Animado */}
        <div className="flex z-10 animate-[moveTrain_10s_linear_forwards] items-end">
            {/* Locomotora (Cabeza) - Usamos la misma imagen por ahora según reporte de subagente */}
            <div className="relative w-[500px] h-[280px] shrink-0 mb-[-20px]">
                <Image 
                    src="/minijuegos/tren/locomotora.png" 
                    alt="Locomotora" 
                    fill 
                    className="object-contain"
                    unoptimized
                />
            </div>
            
            {/* Vagones (Lo que hay que contar) */}
            {Array.from({ length: wagonCount }).map((_, wIdx) => (
                <div key={wIdx} className="relative w-[500px] h-[280px] shrink-0 mb-[-20px]">
                    <Image 
                        src="/minijuegos/tren/bagon.png" 
                        alt="Vagón" 
                        fill 
                        className="object-contain"
                        unoptimized
                    />
                    
                    {/* Pasajeros en este vagón */}
                    {passengers.filter(p => p.wagonIndex === wIdx).map((p, i) => (
                      <div 
                        key={i}
                        className="absolute w-[35px] h-[35px] overflow-hidden rounded-full border-2 border-white/20 bg-black/40"
                        style={{ 
                          left: `${WINDOW_X_CENTERS[p.windowIndex]}%`, 
                          top: WINDOW_Y_TOP,
                          transform: 'translateX(-50%)' 
                        }}
                      >
                        <Image 
                          src={p.charImg} 
                          alt="Pasajero" 
                          fill 
                          className="object-cover scale-125 translate-y-1"
                        />
                      </div>
                    ))}
                </div>
            ))}
        </div>
      </div>

      {/* Input de Respuesta */}
      <div className="flex flex-col items-center gap-4 animate-in fade-in duration-1000 delay-[8000ms]">
        <p className="text-white text-lg md:text-xl tracking-widest text-center uppercase drop-shadow-lg">
          ¿CUÁNTOS PERSONAJES HAS VISTO EN LAS VENTANAS?
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <PixelInput
            type="number"
            placeholder="0"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-24 text-center text-2xl h-14"
            disabled={isFinished}
          />
          <PixelButton 
            variant="green" 
            onClick={handleSubmit}
            disabled={isFinished || !inputValue}
          >
            ENVIAR
          </PixelButton>
        </div>
      </div>

      <style jsx>{`
        @keyframes moveTrain {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(110vw); }
        }
      `}</style>
    </div>
  );
}
