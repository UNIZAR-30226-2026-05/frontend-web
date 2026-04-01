"use client";

import React, { useState } from "react";
import Image from "next/image";

interface MayorMenorUIProps {
  onAction: (result: { cardNumber: number }) => void;
}

export default function MayorMenorUI({ onAction }: MayorMenorUIProps) {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [cardValues, setCardValues] = useState<number[]>([]);

  React.useEffect(() => {
    // Generar 4 valores aleatorios únicos entre 1 y 50
    const values: number[] = [];
    while (values.length < 4) {
      const v = Math.floor(Math.random() * 50) + 1;
      if (!values.includes(v)) values.push(v);
    }
    setCardValues(values);
  }, []);

  const handleCardClick = (index: number) => {
    if (selectedCard !== null) return;
    
    setSelectedCard(index);
    // Esperar a que la animación de giro termine antes de llamar a onAction
    setTimeout(() => {
      onAction({ cardNumber: cardValues[index] });
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full gap-12 font-pixel">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full max-w-2xl">
        {Array.from({ length: 4 }).map((_, i) => (
          <div 
            key={i}
            className={`relative group cursor-pointer aspect-[3/4] perspective-1000 
              ${selectedCard !== null && selectedCard !== i ? "opacity-50 grayscale" : "opacity-100"}
              transition-all duration-500`}
            onClick={() => handleCardClick(i)}
          >
            {/* Animación de Giro (Flip) */}
            <div 
              className={`relative w-full h-full transition-transform duration-700 preserve-3d
                ${selectedCard === i ? "rotate-y-180" : "hover:scale-105"}`}
            >
              {/* Parte Trasera (Dorso) */}
              <div className="absolute inset-0 backface-hidden flex items-center justify-center border-4 border-white/20 bg-slate-800 rounded-xl shadow-lg overflow-hidden">
                <Image 
                    src="/minijuegos/carta_alta/dorso_carta.png" 
                    alt="Dorso de carta" 
                    fill 
                    className="object-cover opacity-100"
                    unoptimized
                />
                <span className="absolute text-5xl text-white/5 font-bold z-10">?</span>
              </div>

              {/* Parte Delantera (Valor) */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center border-4 border-amber-500 bg-slate-100 rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                <div className="text-4xl md:text-6xl text-slate-900 font-bold">
                    {cardValues[i]}
                </div>
                <div className="w-8 h-8 rounded-full bg-slate-900/5 mt-4 border-2 border-slate-900 flex items-center justify-center pt-1" />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="text-center">
        <p className="text-white text-lg md:text-xl tracking-widest uppercase animate-pulse">
            {selectedCard === null ? "¡Escoge una carta para ordenar!" : "¡Suerte!"}
        </p>
      </div>

      <style jsx>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
      `}</style>
    </div>
  );
}
