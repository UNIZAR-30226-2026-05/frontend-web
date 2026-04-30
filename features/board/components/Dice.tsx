"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import PixelButton from "@/components/UI/PixelButton";
import { useGameContext } from "@/features/board/context/GameContext";

export type DiceType = "oro" | "plata" | "bronce" | "normal";

const DICE_MAX: Record<DiceType, number> = { oro: 6, plata: 4, bronce: 2, normal: 6 };

const filterStyles: Record<DiceType, string> = {
  oro: "brightness(1.1) sepia(1) hue-rotate(-15deg) saturate(4)",
  plata: "grayscale(1) brightness(1.2) contrast(1.1)",
  bronce: "sepia(1) hue-rotate(-30deg) saturate(2) brightness(0.7)",
  normal: "none",
};

const diceLabels: Record<DiceType, string> = {
  oro: "1-6 ORO",
  plata: "1-4 PLATA",
  bronce: "1-2 BRONCE",
  normal: "1-6 NORMAL",
};

interface DiceProps {
  onOpenShop?: () => void;
}

export default function Dice({ onOpenShop }: DiceProps) {
  const { state, isMyTurn, myPlayer, sendMovePlayer, sendEndRound, isAnyoneAnimating, dispatch } = useGameContext();
  const { hasMoved, awaitingEndRound, lastDice } = state;
  const penaltyTurns = state.penaltyTurns;

  const [currentNormal, setCurrentNormal] = useState(1);
  const [currentSpecial, setCurrentSpecial] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isRollingVisual, setIsRollingVisual] = useState(false);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const prevLastDiceRef = useRef<typeof lastDice>(null);

  useEffect(() => {
    let frameId = 0;

    if (lastDice !== null) {
      const prev = prevLastDiceRef.current;
      const didChange =
        !prev ||
        prev.dado1 !== lastDice.dado1 ||
        prev.dado2 !== lastDice.dado2 ||
        prev.user !== lastDice.user;
      if (didChange) {
        frameId = requestAnimationFrame(() => {
          setIsAnimating(true);
          setWaitingForResponse(false);
        });
      }
    }
    prevLastDiceRef.current = lastDice;

    return () => {
      if (frameId !== 0) cancelAnimationFrame(frameId);
    };
  }, [lastDice]);

  useEffect(() => {
    let frameId = 0;

    if (isMyTurn && waitingForResponse) {
      frameId = requestAnimationFrame(() => {
        setWaitingForResponse(false);
      });
    }

    return () => {
      if (frameId !== 0) cancelAnimationFrame(frameId);
    };
  }, [isMyTurn, waitingForResponse]);

  // Effect: ciclar los dados aleatoriamente y manejar la duración de la visibilidad
  useEffect(() => {
    if (!lastDice || !isAnimating) return;

    setIsRollingVisual(true);
    const maxSpecial = DICE_MAX[lastDice.diceType];
    const showSpecial = lastDice.diceType !== 'normal' && lastDice.dado2 > 0;

    const rollInterval = setInterval(() => {
      setCurrentNormal(Math.floor(Math.random() * 6) + 1);
      if (showSpecial) {
        setCurrentSpecial(Math.floor(Math.random() * maxSpecial) + 1);
      }
    }, 100);

    // Fase 1: Parar el rodado visual a los 1000ms
    const rollTimeout = setTimeout(() => {
      clearInterval(rollInterval);
      setIsRollingVisual(false);
      setCurrentNormal(lastDice.dado1);
      if (lastDice.dado2 > 0) setCurrentSpecial(lastDice.dado2);
    }, 1000);

    // Fase 2: Ocultar el panel completo a los 1800ms
    // (Dando 800ms de tiempo estático para ver el resultado)
    const hideTimeout = setTimeout(() => {
      setIsAnimating(false);
      dispatch({ type: 'CLEAR_LAST_DICE' });
    }, 1800);

    return () => {
      clearInterval(rollInterval);
      clearTimeout(rollTimeout);
      clearTimeout(hideTimeout);
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
  const isRolling = isRollingVisual || waitingForResponse;

  // Ocultar mientras cualquier ficha se mueve para no tapar la acción, 
  // pero solo si ya hemos terminado de ver el dado.
  if (isAnyoneAnimating && !isAnimating && !waitingForResponse) return null;

  // Visibilidad: solo si es mi turno, o hay animación, o hay un resultado visible, o alguien está esperando
  const isSpectating = !isMyTurn && !lastDice && !isAnimating;
  
  // Si estamos esperando a otro jugador al inicio de la ronda, mostramos el panel con estado "esperando"
  if (isSpectating && !currentTurnPlayer) return null;

  const handleRollDice = () => {
    if (!canRoll) return;
    setWaitingForResponse(true);
    sendMovePlayer();
  };

  const getTitle = () => {
    if (isAnimating) return "TIRANDO...";
    if (lastDice) return "RESULTADO";
    if (isMyTurn) return "ES TU TURNO";
    if (currentTurnPlayer) return `TURNO DE ${currentTurnPlayer.username.toUpperCase()}`;
    return "";
  };

  const renderDie = (value: number, type: DiceType, isSpecial: boolean) => {
    const isPlaceholder = !lastDice && !isAnimating;

    return (
      <div className="flex flex-col items-center gap-3">
        <div className={`relative w-44 h-44 transition-all duration-300 flex items-center justify-center
          ${isRolling ? "animate-pulse scale-110 rotate-12" : "scale-100 rotate-0"}
        `}>
          {isPlaceholder ? (
            <span className="text-white text-5xl font-pixel">?</span>
          ) : (
            <Image
              src={`/dice/${value}.png`}
              alt={`Dado ${isSpecial ? type : 'normal'} cara ${value}`}
              fill
              sizes="176px"
              className="object-contain p-2"
              style={{ filter: isSpecial ? filterStyles[type] : 'none' }}
            />
          )}
        </div>
        {isPlaceholder && (
          <span className={`text-[10px] font-pixel tracking-tighter ${isSpecial ? 'text-amber-400' : 'text-white'}`}>
            {diceLabels[type]}
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="bg-slate-900/40 border-4 border-amber-500/50 rounded-[40px] p-8 backdrop-blur-sm shadow-2xl flex flex-col items-center gap-6 min-w-[480px] animate-in fade-in zoom-in duration-300">
      {/* Título */}
      <h3 className="text-amber-400 font-pixel text-xl uppercase tracking-[0.2em] mb-2 drop-shadow-[0_0_8px_rgba(251,191,36,0.5)]">
        {getTitle()}
      </h3>

      {/* Contenedor de Dados */}
      <div className="flex items-start justify-center gap-8 min-h-[140px]">
        {renderDie(currentNormal, "normal", false)}
        {showSecondDice && renderDie(currentSpecial, displayType, true)}
      </div>

      {/* Resultado Numérico Total (solo al terminar de rodar) */}
      {isAnimating && !isRollingVisual && lastDice && (
        <div className="text-amber-400 font-pixel text-8xl animate-in zoom-in duration-300 drop-shadow-[0_0_25px_rgba(251,191,36,0.9)] -mt-2 mb-2">
          {lastDice.dado1 + lastDice.dado2}
        </div>
      )}

      {/* Botones de acción */}
      {isMyTurn && (
        <div className="flex gap-4 w-full">
          {!hasMoved && (
            <>
              {myPlayer?.character === 'banquero' && (
                <PixelButton
                  variant={state.hasUsedAbility ? "red" : "green"}
                  onClick={() => dispatch({ type: 'SET_SHOW_BANQUERO_MODAL', value: true })}
                  disabled={state.hasUsedAbility}
                  className="flex-1 text-sm py-4 uppercase disabled:opacity-50"
                >
                  {state.hasUsedAbility ? "Robado" : "Robar"}
                </PixelButton>
              )}
              <PixelButton
                variant="purple"
                onClick={onOpenShop}
                className="flex-1 text-sm py-4 uppercase"
              >
                Tienda
              </PixelButton>
            </>
          )}

          {awaitingEndRound ? (
            <PixelButton onClick={sendEndRound} variant="purple" className="flex-1 py-4">
              Fin de Turno
            </PixelButton>
          ) : isBlocked ? (
            <PixelButton onClick={sendEndRound} variant="red" className="flex-1 py-4">
              Saltar Turno ({penaltyTurns})
            </PixelButton>
          ) : (
            <PixelButton
              onClick={handleRollDice}
              disabled={!canRoll || isRolling}
              variant="purple"
              className="flex-1 py-4 uppercase"
            >
              {isRolling ? "Tirando..." : (displayType === "normal" ? "Tirar Dado" : "Tirar Dados")}
            </PixelButton>
          )}
        </div>
      )}
    </div>
  );
}
