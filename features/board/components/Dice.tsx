"use client";

import { useState, useEffect } from "react";
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
  const { state, isMyTurn, myPlayer, sendMovePlayer, sendEndRound, isAnyoneAnimating } = useGameContext();
  const { hasMoved, awaitingEndRound, lastDice } = state;
  const penaltyTurns = state.penaltyTurns;

  const [currentNormal, setCurrentNormal] = useState(1);
  const [currentSpecial, setCurrentSpecial] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  // Controla el estado "esperando respuesta del backend" tras pulsar el botón
  const [waitingForResponse, setWaitingForResponse] = useState(false);

  // ── Render-phase: detectar nuevo lastDice para arrancar animación ──────────
  // Patrón "storing information from previous renders" (React docs) – evita
  // llamar a setState de forma síncrona dentro de un useEffect (cascade renders).
  const [prevLastDice, setPrevLastDice] = useState<typeof lastDice>(null);
  if (prevLastDice !== lastDice) {
    setPrevLastDice(lastDice);
    if (lastDice !== null) {
      const prev = prevLastDice;
      const didChange =
        !prev ||
        prev.dado1 !== lastDice.dado1 ||
        prev.dado2 !== lastDice.dado2 ||
        prev.user !== lastDice.user;
      if (didChange) {
        setIsAnimating(true);
        setWaitingForResponse(false);
      }
    }
  }

  // ── Render-phase: limpiar waitingForResponse al recuperar el turno ────────
  const [prevIsMyTurn, setPrevIsMyTurn] = useState(isMyTurn);
  if (prevIsMyTurn !== isMyTurn) {
    setPrevIsMyTurn(isMyTurn);
    if (isMyTurn && waitingForResponse) {
      setWaitingForResponse(false);
    }
  }

  // ── Effect: ciclar los dados aleatoriamente 1 s cuando se activa animación ─
  // Solo llama a setState dentro de callbacks (setInterval/setTimeout), no en
  // el cuerpo síncrono del efecto → sin cascade renders.
  useEffect(() => {
    if (!lastDice || !isAnimating) return;

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
  }, [lastDice, isAnimating]);

  // Tipo de dado a mostrar: el de la última tirada o el del turno actual
  const currentTurnPlayer = Object.values(state.players).find(
    p => p.turnOrder === state.currentTurnOrder
  );
  const displayType: DiceType = lastDice?.diceType ?? currentTurnPlayer?.diceType ?? 'normal';

  // Mostrar el dado especial si la última tirada lo usó, o si es mi turno y tengo dado especial
  const showSecondDice = lastDice
    ? (lastDice.diceType !== 'normal' && lastDice.dado2 > 0)
    : (isMyTurn && myPlayer !== null && myPlayer.diceType !== 'normal');

  const isBlocked = penaltyTurns > 0;
  const canRoll = isMyTurn && !hasMoved && !waitingForResponse && !awaitingEndRound && !isBlocked && !isAnyoneAnimating;
  const isRolling = isAnimating || waitingForResponse;

  const handleRollDice = () => {
    if (!canRoll) return;
    setWaitingForResponse(true);
    sendMovePlayer();
  };

  // Texto del botón de tirar
  const rollButtonLabel = () => {
    if (isRolling) return "Tirando...";
    if (awaitingEndRound) return "Moviendo...";
    if (isBlocked) return `Bloqueado (${penaltyTurns} turno${penaltyTurns > 1 ? 's' : ''} restante${penaltyTurns > 1 ? 's' : ''})`;
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
      {isBlocked && isMyTurn ? (
        <PixelButton onClick={sendEndRound} variant="red" className="w-full">
          Saltar Turno ({penaltyTurns} restante{penaltyTurns > 1 ? 's' : ''})
        </PixelButton>
      ) : (
        <PixelButton
          onClick={handleRollDice}
          disabled={!canRoll || isRolling || awaitingEndRound}
          variant="purple"
          className="w-full"
        >
          {rollButtonLabel()}
        </PixelButton>
      )}
    </div>
  );
}
