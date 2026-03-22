"use client";

import { useState, useEffect } from "react";
import PixelButton from "@/components/UI/PixelButton";

export type DiceType = "oro" | "plata" | "bronce" | "normal";

interface DiceProps {
  resultado?: number;           // Resultado para el dado normal
  resultadoAdicional?: number;  // Resultado para el dado especial (si existe)
  type?: DiceType;
}

export default function Dice({ resultado, resultadoAdicional, type = "normal" }: DiceProps) {
  const [currentNormal, setCurrentNormal] = useState(1);
  const [currentSpecial, setCurrentSpecial] = useState(1);
  const [isRolling, setIsRolling] = useState(false);
  const [activeType, setActiveType] = useState<DiceType>(type);

  // Sincronizar con el prop type si cambia externamente
  useEffect(() => {
    setActiveType(type);
  }, [type]);

  const getDiceMax = (t: DiceType) => {
    switch (t) {
      case "oro":
      case "normal": return 6;
      case "plata": return 4;
      case "bronce": return 2;
      default: return 6;
    }
  };

  const rollDice = () => {
    if (isRolling) return;

    setIsRolling(true);
    const maxSpecial = getDiceMax(activeType);

    // Cambiar de cara rápidamente para simular que está rodando
    const rollInterval = setInterval(() => {
      // Siempre rodar el dado normal (1-6)
      setCurrentNormal(Math.floor(Math.random() * 6) + 1);
      // Rodar el especial si aplica
      if (activeType !== "normal") {
        setCurrentSpecial(Math.floor(Math.random() * maxSpecial) + 1);
      }
    }, 100);

    // Finalizar la tirada después de 1 segundo
    setTimeout(() => {
      clearInterval(rollInterval);
      
      // Dado Normal (siempre 1-6)
      let finalNormal: number;
      if (resultado && resultado >= 1 && resultado <= 6) {
        finalNormal = resultado;
      } else {
        finalNormal = Math.floor(Math.random() * 6) + 1;
      }

      // Dado Especial (si aplica)
      let finalSpecial: number;
      if (resultadoAdicional && resultadoAdicional >= 1 && resultadoAdicional <= maxSpecial) {
        finalSpecial = resultadoAdicional;
      } else {
        finalSpecial = Math.floor(Math.random() * maxSpecial) + 1;
      }

      setCurrentNormal(finalNormal);
      setCurrentSpecial(finalSpecial);
      setIsRolling(false);
    }, 1000);
  };

  // Estilos sutiles (Glow y Bordes)
  const typeStyles: Record<DiceType, string> = {
    oro: "border-yellow-400/50 shadow-[0_0_15px_rgba(255,215,0,0.5)]",
    plata: "border-slate-300/50 shadow-[0_0_15px_rgba(203,213,225,0.4)]",
    bronce: "border-orange-700/50 shadow-[0_0_15px_rgba(194,65,12,0.4)]",
    normal: "border-white shadow-lg",
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Panel de Verificación Temporal (Ahora arriba) */}
      <div className="p-4 bg-black/20 rounded-lg border border-white/10 backdrop-blur-sm w-full">
        <p className="text-xs text-slate-400 mb-2 font-mono text-center">DEBUG: Cambiar Calidad</p>
        <div className="grid grid-cols-2 gap-2">
          {(["normal", "oro", "plata", "bronce"] as DiceType[]).map((t) => (
            <button
              key={t}
              onClick={() => setActiveType(t)}
              disabled={isRolling}
              className={`px-3 py-1 text-[10px] rounded border transition-colors capitalize
                ${activeType === t 
                  ? "bg-white text-black border-white" 
                  : "bg-transparent text-white border-white/30 hover:border-white/60"}
                disabled:opacity-50 disabled:cursor-not-allowed
              `}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Contenedor de Dados */}
      <div className="flex items-center justify-center gap-4 min-h-[120px]">
        {/* Dado Normal (Siempre se muestra) */}
        <div className="relative group">
          <img
            src={`/dice/normal_${currentNormal}.jpg`}
            alt={`Dado normal cara ${currentNormal}`}
            className={`w-24 h-24 rounded-xl border-4 object-cover bg-white transition-all duration-300 
              border-white shadow-lg
              ${isRolling ? "animate-pulse scale-110 rotate-12" : "scale-100 rotate-0"}
            `}
          />
        </div>

        {/* Dado Especial (Solo si activeType !== 'normal') */}
        {activeType !== "normal" && (
          <div className="relative group animate-in slide-in-from-right duration-300">
            <img
              src={`/dice/${activeType}_${currentSpecial}.jpg`}
              alt={`Dado ${activeType} cara ${currentSpecial}`}
              className={`w-24 h-24 rounded-xl border-4 object-cover bg-white transition-all duration-300 
                ${typeStyles[activeType]} 
                ${isRolling ? "animate-pulse scale-110 rotate-12" : "scale-100 rotate-0"}
              `}
            />
          </div>
        )}
      </div>

      {/* Botón de acción */}
      <PixelButton onClick={rollDice} disabled={isRolling} variant="purple_blue" className="w-full">
        {isRolling ? "Tirando..." : (activeType === "normal" ? "Tirar Dado" : "Tirar Dados")}
      </PixelButton>
    </div>
  );
}
