"use client";

import { useState, useEffect, useRef } from "react";
import PixelButton from "@/components/UI/PixelButton";
import { useGameContext } from "@/features/board/context/GameContext";

export type DiceType = "oro" | "plata" | "bronce" | "normal";

const DICE_MAX: Record<DiceType, number> = { oro: 6, plata: 4, bronce: 2, normal: 6 };

const typeStyles: Record<DiceType, string> = {
  oro: "border-yellow-400/50 shadow-[0_0_15px_rgba(255,215,0,0.5)]",
  plata: "border-slate-300/50 shadow-[0_0_15px_rgba(203,213,225,0.4)]",
  bronce: "border-orange-700/50 shadow-[0_0_15px_rgba(194,65,12,0.4)]",
  normal: "border-white shadow-lg",
};

export default function Dice() {
  const { state, isMyTurn, myPlayer, sendMovePlayer, sendEndRound } = useGameContext();
  const { hasMoved, awaitingEndRound, lastDice } = state;

  const [currentNormal, setCurrentNormal] = useState(1);
  const [currentSpecial, setCurrentSpecial] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  // Controla el estado "esperando respuesta del backend" tras pulsar el botón
  const [waitingForResponse, setWaitingForResponse] = useState(false);

  // Referencia al lastDice previo para detectar cambios
  const prevLastDiceRef = useRef<typeof lastDice>(null);

  // Cuando llegue una respuesta player_moved con dados, animar y mostrar resultado
  useEffect(() => {
    if (!lastDice) return;
    // Evitar re-animar si no cambió nada
    const prev = prevLastDiceRef.current;
    if (
      prev &&
      prev.dado1 === lastDice.dado1 &&
      prev.dado2 === lastDice.dado2 &&
      prev.user === lastDice.user
    ) return;
    prevLastDiceRef.current = lastDice;

    setIsAnimating(true);
    setWaitingForResponse(false);

    const maxSpecial = DICE_MAX[lastDice.diceType];
    const showSpecial = lastDice.diceType !== 'normal' && lastDice.dado2 > 0;

    const rollInterval = setInterval(() => {
      setCurrentNormal(Math.floor(Math.random() * 6) + 1);
      if (showSpecial) {
        setCurrentSpecial(Math.floor(Math.random() * maxSpecial) + 1);
      }
    }, 100);

    const timeout = setTimeout(() => {
      clearInterval(rollInterval);
      setCurrentNormal(lastDice.dado1);
      if (lastDice.dado2 > 0) setCurrentSpecial(lastDice.dado2);
      setIsAnimating(false);
    }, 1000);

    return () => {
      clearInterval(rollInterval);
      clearTimeout(timeout);
    };
  }, [lastDice]);

  // Tipo de dado a mostrar: el de la última tirada o el del turno actual
  const currentTurnPlayer = Object.values(state.players).find(
    p => p.turnOrder === state.currentTurnOrder
  );
  const displayType: DiceType = lastDice?.diceType ?? currentTurnPlayer?.diceType ?? 'normal';

  // Mostrar el dado especial si la última tirada lo usó, o si es mi turno y tengo dado especial
  const showSecondDice = lastDice
    ? (lastDice.diceType !== 'normal' && lastDice.dado2 > 0)
    : (isMyTurn && myPlayer !== null && myPlayer.diceType !== 'normal');

  const canRoll = isMyTurn && !hasMoved && !waitingForResponse && !awaitingEndRound;
  const isRolling = isAnimating || waitingForResponse;

  const handleRollDice = () => {
    if (!canRoll) return;
    setWaitingForResponse(true);
    sendMovePlayer();
  };

  // Texto del botón de tirar
  const rollButtonLabel = () => {
    if (isRolling) return "Tirando...";
    if (!isMyTurn) return "Esperando turno...";
    return displayType === "normal" ? "Tirar Dado" : "Tirar Dados";
  };

  return (
    <div className="flex flex-col items-center gap-6">
      {/* Contenedor de Dados */}
      <div className="flex items-center justify-center gap-4 min-h-[120px]">
        {/* Dado Normal (siempre visible) */}
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

        {/* Dado Especial (oro/plata/bronce) */}
        {showSecondDice && (
          <div className="relative group animate-in slide-in-from-right duration-300">
            <img
              src={`/dice/${displayType}_${currentSpecial}.jpg`}
              alt={`Dado ${displayType} cara ${currentSpecial}`}
              className={`w-24 h-24 rounded-xl border-4 object-cover bg-white transition-all duration-300
                ${typeStyles[displayType]}
                ${isRolling ? "animate-pulse scale-110 rotate-12" : "scale-100 rotate-0"}
              `}
            />
          </div>
        )}
      </div>

      {/* Botones de acción */}
      {awaitingEndRound ? (
        <PixelButton onClick={sendEndRound} variant="purple" className="w-full">
          Fin de Turno
        </PixelButton>
      ) : (
        <PixelButton
          onClick={handleRollDice}
          disabled={!canRoll || isRolling}
          variant="purple"
          className="w-full"
        >
          {rollButtonLabel()}
        </PixelButton>
      )}
    </div>
  );
}
