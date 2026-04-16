"use client";

import { useState, useEffect, useMemo } from "react";
import PixelButton from "@/components/UI/PixelButton";
import { useGameContext } from "@/features/board/context/GameContext";
import ShopModal from "@/features/shop/components/ShopModal";

export type DiceType = "oro" | "plata" | "bronce" | "normal";

const DICE_MAX: Record<DiceType, number> = { 
  oro: 6, 
  plata: 4, 
  bronce: 2, 
  normal: 6 
};

const DICE_LABELS: Record<DiceType, string> = {
  oro: "1-6 ORO",
  plata: "1-4 PLATA",
  bronce: "1-2 BRONCE",
  normal: "1-6"
};

const DICE_COLORS: Record<DiceType, string> = {
  oro: "bg-[#FFD700] text-[#7B6500]",
  plata: "bg-[#C0C0C0] text-[#4A4A4A]",
  bronce: "bg-[#CD7F32] text-[#5C2E0E]",
  normal: "bg-white text-gray-400"
};

export default function ActionPanel() {
  const { state, isMyTurn, myPlayer, sendMovePlayer, sendEndRound } = useGameContext();
  const { hasMoved, awaitingEndRound, lastDice, penaltyTurns } = state;

  const [isShopOpen, setIsShopOpen] = useState(false);
  const [currentNormal, setCurrentNormal] = useState(1);
  const [currentSpecial, setCurrentSpecial] = useState(1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [waitingForResponse, setWaitingForResponse] = useState(false);

  // visualState calculation
  // 1. ROLLING if animating or waiting for backend
  // 2. RESULT if hasMoved and lastDice is present
  // 3. PRE_ROLL otherwise
  const visualState = useMemo(() => {
    if (isAnimating || waitingForResponse) return "ROLLING";
    if (lastDice) return "RESULT";
    return "PRE_ROLL";
  }, [isAnimating, waitingForResponse, lastDice]);

  // Sync animation with lastDice
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

  const handleRollDice = () => {
    if (!isMyTurn || hasMoved || waitingForResponse || awaitingEndRound || penaltyTurns > 0) return;
    setWaitingForResponse(true);
    sendMovePlayer();
  };

  const currentDiceType: DiceType = myPlayer?.diceType ?? 'normal';
  const showSecondDice = currentDiceType !== 'normal';

  // Rendering logic for dice boxes
  const renderDiceSlot = (type: DiceType, value: number, isSpecial = false) => {
    if (visualState === "PRE_ROLL") {
      return (
        <div className="flex flex-col items-center gap-2">
          <div className={`w-28 h-28 rounded-2xl flex items-center justify-center shadow-xl border-4 border-black/10 ${DICE_COLORS[type]}`}>
            <span className="text-6xl font-pixel drop-shadow-sm opacity-60">?</span>
          </div>
          <span className={`font-pixel text-xs tracking-wider uppercase ${isSpecial ? 'font-bold' : 'text-white/60'}`}>
            {DICE_LABELS[type]}
          </span>
        </div>
      );
    }

    // ROLLING or RESULT
    const dieDisplayType = visualState === "RESULT" ? lastDice?.diceType ?? type : type;
    const spritePath = isSpecial 
      ? `/dice/${dieDisplayType}_${value}.jpg`
      : `/dice/normal_${value}.jpg`;

    return (
      <div className="flex flex-col items-center gap-2">
        <div className={`w-28 h-28 rounded-2xl overflow-hidden border-4 border-black/20 shadow-xl transition-all duration-300 ${visualState === "ROLLING" ? 'animate-pulse scale-105 rotate-3' : 'scale-100'}`}>
           <img 
            src={spritePath} 
            alt="Dice" 
            className="w-full h-full object-cover pixelated"
          />
        </div>
        {visualState === "PRE_ROLL" && (
           <span className="font-pixel text-xs text-white/60 tracking-wider uppercase">
            {DICE_LABELS[type]}
          </span>
        )}
      </div>
    );
  };

  const totalSum = (lastDice?.dado1 ?? 0) + (lastDice?.dado2 ?? 0);

  const titleText = useMemo(() => {
    if (visualState === "RESULT") return "RESULTADO";
    if (visualState === "ROLLING") return "TIRANDO...";
    if (isMyTurn) return "ES TU TURNO";
    return "ESPERANDO TURNO...";
  }, [visualState, isMyTurn]);

  // Solo mostrar el panel si es mi turno o si hay una animación/resultado en curso para todos
  if (!isMyTurn && visualState === "PRE_ROLL") return null;

  return (
    <div className="flex flex-col items-center gap-6 select-none bg-slate-900/95 border-4 border-amber-500/50 rounded-[40px] p-10 backdrop-blur-xl shadow-[0_0_50px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-bottom-10 duration-500">
      {/* Title State */}
      <h2 className="font-pixel text-white text-2xl tracking-[0.3em] uppercase drop-shadow-md mb-2">
        {titleText}
      </h2>

      {/* Dice Container */}
      <div className={`flex items-center gap-8 transition-all duration-500`}>
        {renderDiceSlot("normal", currentNormal)}
        {showSecondDice && renderDiceSlot(currentDiceType, currentSpecial, true)}
      </div>

      {/* Result Sum */}
      {visualState === "RESULT" && (
        <div className="flex flex-col items-center -mt-4 animate-in zoom-in duration-700">
          <span className="text-7xl font-pixel glow-text-amber animate-pulse">
            {totalSum}
          </span>
        </div>
      )}

      {/* Action Buttons - Solo visibles si es mi turno */}
      {isMyTurn && (
        <div className="flex items-center gap-4 min-w-[320px] justify-center mt-4">
          {/* Shop Button - Only Pre-Roll */}
          {visualState === "PRE_ROLL" && (
            <PixelButton 
              variant="purple" 
              onClick={() => setIsShopOpen(true)}
              className="px-8 py-3 uppercase text-xs"
            >
              Tienda
            </PixelButton>
          )}

          {/* Main Action Button */}
          <div className="flex-1 max-w-[200px]">
            {awaitingEndRound ? (
              <PixelButton 
                variant="purple" 
                onClick={sendEndRound}
                className="w-full py-4 uppercase text-sm shadow-[0_0_20px_rgba(137,82,229,0.4)]"
              >
                FIN DE TURNO
              </PixelButton>
            ) : (
              <PixelButton
                variant="purple"
                disabled={visualState === "ROLLING" || penaltyTurns > 0}
                onClick={handleRollDice}
                className="w-full py-4 uppercase text-sm disabled:opacity-50"
              >
                {visualState === "ROLLING" ? "TIRANDO..." : 
                 penaltyTurns > 0 ? `BLOQUEADO (${penaltyTurns})` :
                 "TIRAR DADOS"}
              </PixelButton>
            )}
          </div>
        </div>
      )}

      {/* Modals */}
      {isShopOpen && <ShopModal onClose={() => setIsShopOpen(false)} />}

      <style jsx>{`
        .glow-text-amber {
          color: #FFD700;
          text-shadow: 0 0 15px rgba(255, 215, 0, 0.9), 
                       0 0 30px rgba(255, 215, 0, 0.4);
        }
      `}</style>
    </div>
  );
}


