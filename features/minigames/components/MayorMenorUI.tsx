"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";

interface MayorMenorUIProps {
  onAction: (result: { score: number }) => void;
  character?: "banquero" | "escapista" | "vidente" | "videojugador";
}

interface Card {
  suit: string;
  rank: number;
}

export default function MayorMenorUI({ onAction, character }: MayorMenorUIProps) {
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [cardValues, setCardValues] = useState<Card[]>([]);

  const [debugCardWidth, setDebugCardWidth] = useState(180);
  const [debugCardGap, setDebugCardGap] = useState(64);
  const [debugFlipDuration, setDebugFlipDuration] = useState(800);
  const [debugBackIndex, setDebugBackIndex] = useState(1);
  const [isDebug, setIsDebug] = useState(false);

  useEffect(() => {
    // Activar debug si estamos en la ruta de debug
    if (typeof window !== "undefined" && window.location.pathname.includes("debug")) {
      setIsDebug(true);
    }
  }, []);

  useEffect(() => {
    // Generar 4 cartas aleatorias únicas
    const suits = ["hearts", "diamonds", "spades", "clubs"];
    const pickedCards: Card[] = [];
    
    while (pickedCards.length < 4) {
      const rank = Math.floor(Math.random() * 13) + 1;
      const suit = suits[Math.floor(Math.random() * 4)];
      
      const isDuplicate = pickedCards.some(c => c.rank === rank && c.suit === suit);
      if (!isDuplicate) {
        pickedCards.push({ rank, suit });
      }
    }
    setCardValues(pickedCards);
  }, []);

  const tableBg = character || (isDebug ? "videojugador" : "banquero"); // Default a banquero or similar if not specified

  const handleCardClick = (index: number) => {
    if (selectedCard !== null) return;
    
    setSelectedCard(index);
    // Score: rank (1-13)
    const score = Math.max(0, Math.min(9999, Math.floor(cardValues[index].rank)));
    
    // Esperar a que la animación de giro termine antes de llamar a onAction
    setTimeout(() => {
      onAction({ score });
    }, debugFlipDuration + 100);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden font-pixel flex flex-col items-center justify-center">
      
      {/* Debug Controls Overlay */}
      {isDebug && (
        <div className="absolute top-4 left-4 z-50 bg-black/80 p-4 border-2 border-amber-500 text-white text-xs flex flex-col gap-2 rounded-lg backdrop-blur-md">
          <div className="font-bold text-amber-500 mb-2 underline">CARDS DEBUGGER</div>
          <div className="flex flex-col">
            <label>Card Width: {debugCardWidth}px</label>
            <input 
              type="range" min="100" max="400" step="4" 
              value={debugCardWidth} onChange={(e) => setDebugCardWidth(parseInt(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>Card Gap: {debugCardGap}px</label>
            <input 
              type="range" min="0" max="100" step="4" 
              value={debugCardGap} onChange={(e) => setDebugCardGap(parseInt(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>Flip Duration: {debugFlipDuration}ms</label>
            <input 
              type="range" min="100" max="2000" step="50" 
              value={debugFlipDuration} onChange={(e) => setDebugFlipDuration(parseInt(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>Card Back: {debugBackIndex}</label>
            <input 
              type="range" min="1" max="8" step="1" 
              value={debugBackIndex} onChange={(e) => setDebugBackIndex(parseInt(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="mt-2 p-2 bg-white/10 rounded font-mono text-[9px]">
            cardWidth: {debugCardWidth},<br/>
            cardGap: {debugCardGap},<br/>
            flipDuration: {debugFlipDuration},<br/>
            backIdx: {debugBackIndex}
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

      {/* Fondo de la Mesa según el Personaje */}
      <div className="absolute inset-0 z-0">
        <Image 
          src={`/minijuegos/carta_alta/mesa_${tableBg}.png`} 
          alt={`Mesa de ${tableBg}`} 
          fill 
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Cartas Centradas Horizontalmente */}
      <div 
        className="relative z-10 flex flex-row w-full max-w-6xl px-8 justify-center items-center"
        style={{ gap: `${debugCardGap}px` }}
      >
        {Array.from({ length: 4 }).map((_, i) => (
          <div 
            key={i}
            className={`relative group cursor-pointer aspect-[3/4.5] perspective-1000 
              ${selectedCard !== null && selectedCard !== i ? "opacity-30 scale-90 grayscale" : "opacity-100 scale-100"}
              transition-all duration-500`}
            style={{ width: `${debugCardWidth}px` }}
            onClick={() => handleCardClick(i)}
          >
            {/* Animación de Giro (Flip) */}
            <div 
              className={`relative w-full h-full transition-transform preserve-3d
                ${selectedCard === i ? "rotate-y-180" : "hover:scale-105 active:scale-95"}`}
              style={{ transitionDuration: `${debugFlipDuration}ms` }}
            >
              {/* Parte Trasera (Dorso) */}
              <div className="absolute inset-0 backface-hidden flex items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img 
                    src="/minijuegos/carta_alta/reverso_carta.png" 
                    alt="Dorso de carta" 
                    className="w-full h-full object-contain"
                    style={{ imageRendering: 'pixelated' }}
                />
              </div>

              {/* Parte Delantera (Valor) */}
              <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {cardValues.length > 0 && (
                  <img 
                      src={`/minijuegos/carta_alta/cards/card_${cardValues[i]?.suit}_${cardValues[i]?.rank}.png`} 
                      alt={`Carta ${cardValues[i]?.rank} de ${cardValues[i]?.suit}`} 
                      className="w-full h-full object-contain"
                      style={{ imageRendering: 'pixelated' }}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <style jsx>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        img { image-rendering: pixelated !important; image-rendering: crisp-edges !important; }
      `}</style>
    </div>
  );
}
