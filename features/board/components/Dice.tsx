"use client";

import { useState } from "react";
import PixelButton from "@/components/UI/PixelButton";

interface DiceProps {
  resultado?: number;
}

export default function Dice({ resultado }: DiceProps) {
  const [currentFace, setCurrentFace] = useState(1);
  const [isRolling, setIsRolling] = useState(false);

  const rollDice = () => {
    if (isRolling) return;

    setIsRolling(true);

    // Cambiar de cara rápidamente para simular que está rodando
    const rollInterval = setInterval(() => {
      const randomFace = Math.floor(Math.random() * 6) + 1;
      setCurrentFace(randomFace);
    }, 100);

    // Finalizar la tirada después de 1 segundo
    setTimeout(() => {
      clearInterval(rollInterval);
      // Usar el resultado pasado por prop o generar uno aleatorio
      const finalFace = (resultado && resultado >= 1 && resultado <= 6)
        ? resultado
        : Math.floor(Math.random() * 6) + 1;

      setCurrentFace(finalFace);
      setIsRolling(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      <img
        src={`/dice/basic_${currentFace}.jpg`}
        alt={`Dado cara ${currentFace}`}
        className={`w-24 h-24 rounded-xl border-4 border-white object-cover shadow-lg bg-white transition-all duration-200 ${isRolling ? "animate-pulse scale-110 rotate-12" : "scale-100 rotate-0"
          }`}
      />

      <PixelButton onClick={rollDice} disabled={isRolling} variant="purple_blue" className="w-full">
        {isRolling ? "Tirando..." : "Tirar Dado"}
      </PixelButton>
    </div>
  );
}
