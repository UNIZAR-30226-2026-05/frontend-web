"use client";

import React, { useState} from "react";
import PixelButton from "@/components/UI/PixelButton";

const PREMIOS = [
  { id: 1, name: "Avanzar Casillas", emoji: "👞", color: "#FF4D4D" }, // Rojo
  { id: 2, name: "Mejorar Dados",     emoji: "🎲", color: "#4DFF4D" }, // Verde
  { id: 3, name: "Barrera",           emoji: "🚧", color: "#4D4DFF" }, // Azul
  { id: 4, name: "Salvavidas bloqueo", emoji: "🔒", color: "#FFFF4D" }, // Amarillo
];

interface RuletaUIProps {
  onAction?: (result: { name: string; emoji: string }) => void;
  onClose?: () => void;
}

export default function RuletaUI({ onAction, onClose }: RuletaUIProps) {
  const numPremios = PREMIOS.length;
  const [rotation, setRotation] = useState(0);
  const [isSpinning, setIsSpinning] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [winningIndex, setWinningIndex] = useState<number | null>(null);
  
  const spin = () => {
    if (isSpinning) return;
    
    setIsSpinning(true);
    setShowResult(false);
    
    // Multiple full spins (5-8) + random extra angle
    const extraDegrees = Math.floor(Math.random() * 360);
    const totalNewRotation = rotation + (360 * (6 + Math.floor(Math.random() * 4))) + extraDegrees;
    
    setRotation(totalNewRotation);
    
    const transitionDuration = 5000; // Longer for dramatic effect
    setTimeout(() => {
      const finalRotationNormalized = totalNewRotation % 360;
      const beta = (360 - (finalRotationNormalized % 360)) % 360;
      const step = 360 / numPremios;
      const index = Math.floor(beta / step);
      
      setWinningIndex(index);
      setIsSpinning(false);
      setShowResult(true);
      
      console.log(`[Ruleta Debug] 
        Selection: ${PREMIOS[index].name}
        Pointer at: ${beta.toFixed(2)}deg`);
    }, transitionDuration + 100); 
  };

  const handleAccept = () => {
    if (winningIndex !== null && onAction) {
      onAction({ 
        name: PREMIOS[winningIndex].name, 
        emoji: PREMIOS[winningIndex].emoji 
      });
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 backdrop-blur-md animate-in fade-in duration-500">
      <div className="relative bg-[#0f172a] border-4 border-[#fbbf24] p-12 flex flex-col items-center gap-10 rounded-3xl max-w-xl w-full mx-4 font-pixel shadow-[0_0_60px_rgba(251,191,36,0.25)]">
        
        <div className="text-center">
            <h3 className="text-[#fbbf24] text-4xl tracking-[0.2em] uppercase drop-shadow-[0_4px_0_rgba(0,0,0,0.8)]">
                RUTA DE OBJETOS
            </h3>
            <p className="text-white/40 text-[10px] uppercase tracking-widest mt-2">
                Gira para conseguir un item de la tienda
            </p>
        </div>

        <div className="relative flex flex-col items-center">
            {/* Elegant Golden Pointer */}
            <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center">
                <div className="w-0 h-0 border-l-[18px] border-l-transparent border-r-[18px] border-r-transparent border-t-[36px] border-t-amber-500 drop-shadow-[0_4px_6px_rgba(0,0,0,0.5)]" />
                <div className="w-4 h-4 bg-white rounded-full border-2 border-amber-600 -mt-2 shadow-inner" />
            </div>

            {/* Custom CSS Roulette Wheel */}
            <div className="w-72 h-72 md:w-96 md:h-96 rounded-full border-[10px] border-[#1e293b] shadow-[0_0_40px_rgba(0,0,0,0.6),inset_0_0_30px_rgba(0,0,0,0.5)] relative overflow-hidden bg-[#1e293b]">
                <div 
                    className="w-full h-full transition-transform duration-[5000ms] cubic-bezier(0.2, 0, 0, 1) relative"
                    style={{ 
                        transform: `rotate(${rotation}deg)`,
                        background: `conic-gradient(
                            ${PREMIOS[0].color} 0deg 90deg,
                            ${PREMIOS[1].color} 90deg 180deg,
                            ${PREMIOS[2].color} 180deg 270deg,
                            ${PREMIOS[3].color} 270deg 360deg
                        )`
                    }}
                >
                    {/* Items on the segments */}
                    {PREMIOS.map((item, i) => (
                        <div 
                            key={i}
                            className="absolute top-0 left-0 w-full h-full flex flex-col items-center justify-start pt-10"
                            style={{ transform: `rotate(${i * 90 + 45}deg)` }}
                        >
                            <span className="text-5xl drop-shadow-lg filter drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">{item.emoji}</span>
                            <span className="text-[10px] text-black font-bold uppercase mt-2 max-w-[80px] text-center leading-tight">
                                {item.name}
                            </span>
                        </div>
                    ))}

                    {/* Radial Dividers */}
                    <div className="absolute inset-0 border-white/20 rounded-full">
                        <div className="absolute top-0 left-1/2 w-1 h-full bg-black/30 -translate-x-1/2" />
                        <div className="absolute top-1/2 left-0 w-full h-1 bg-black/30 -translate-y-1/2" />
                    </div>
                </div>

                {/* Center Hub */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 bg-[#0f172a] rounded-full border-4 border-amber-500 z-20 shadow-lg flex items-center justify-center">
                    <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                </div>
            </div>
        </div>

        <div className="flex flex-col items-center gap-6 w-full">
            <PixelButton 
                variant="purple" 
                onClick={spin}
                disabled={isSpinning}
                className={`min-w-[240px] h-16 text-2xl transition-all ${isSpinning ? 'opacity-50 brightness-50' : 'hover:scale-105 active:scale-95'}`}
            >
                {isSpinning ? "GIRANDO..." : "¡GIRAR!"}
            </PixelButton>
            
            {!isSpinning && !showResult && (
                <button 
                    onClick={onClose}
                    className="text-white/30 hover:text-white text-xs uppercase tracking-widest border-b border-transparent hover:border-white transition-all shadow-sm"
                >
                    Abandonar
                </button>
            )}
        </div>

        {/* Result Overlay */}
        {showResult && (
            <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/60 backdrop-blur-md rounded-3xl animate-in zoom-in duration-300">
                <div className="bg-[#1e293b] border-4 border-[#fbbf24] p-10 flex flex-col items-center gap-6 shadow-[0_0_50px_rgba(251,191,36,0.5)]">
                    <p className="text-white/60 text-xs uppercase tracking-[0.3em]">Has obtenido un objeto:</p>
                    <div className="flex flex-col items-center gap-4">
                        <span className="text-8xl animate-bounce">{PREMIOS[winningIndex!].emoji}</span>
                        <h4 className="text-white text-2xl uppercase tracking-widest text-center max-w-[250px]">
                            {PREMIOS[winningIndex!].name}
                        </h4>
                    </div>
                    <PixelButton 
                        variant="green" 
                        onClick={handleAccept}
                        className="mt-4 px-12 h-14"
                    >
                        ACEPTAR
                    </PixelButton>
                </div>
            </div>
        )}
      </div>
    </div>
  );
}
