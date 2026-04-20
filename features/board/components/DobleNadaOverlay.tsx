"use client";

import React from "react";
import PixelButton from "@/components/UI/PixelButton";
import { useGameContext } from "@/features/board/context/GameContext";

export default function DobleNadaOverlay() {
  const { myPlayer, sendScoreDobleNada, state } = useGameContext();
  const balance = myPlayer?.balance ?? 0;
  const isSubmitting = state.isSubmittingDobleNada;
  const result = state.dobleNadaResult;
  const canIncreaseBet = balance > 0;
  const [betAmount, setBetAmount] = React.useState(0);

  React.useEffect(() => {
    if (!state.showDobleNada) return;
    setBetAmount(0);
  }, [state.showDobleNada]);

  const isPass = betAmount === 0;

  const handleIncrement = () => {
    if (!canIncreaseBet || isSubmitting) return;
    setBetAmount(prev => Math.min(balance, prev + 1));
  };

  const handleDecrement = () => {
    if (isSubmitting) return;
    setBetAmount(prev => Math.max(0, prev - 1));
  };

  const handleConfirm = () => {
    if (isSubmitting) return;
    sendScoreDobleNada(betAmount);
  };

  if (result) {
    const isLocalPlayer = result.user === state.myUsername;
    const isWin = result.outcome === 'ganado';
    const isLoss = result.outcome === 'perdido';
    const accentClass = isWin
      ? 'border-[#4ADE80] text-[#4ADE80]'
      : isLoss
        ? 'border-[#F87171] text-[#F87171]'
        : 'border-[#FACC15] text-[#FACC15]';
    const accentTextClass = isWin
      ? 'text-[#4ADE80]'
      : isLoss
        ? 'text-[#F87171]'
        : 'text-[#FACC15]';
    const headline = isLocalPlayer
      ? result.outcome === 'ganado'
        ? 'HAS GANADO'
        : result.outcome === 'perdido'
          ? 'HAS PERDIDO'
          : 'HAS PASADO'
      : result.outcome === 'ganado'
        ? `${result.user.toUpperCase()} HA GANADO`
        : result.outcome === 'perdido'
          ? `${result.user.toUpperCase()} HA PERDIDO`
          : `${result.user.toUpperCase()} HA PASADO`;
    const detail = result.outcome === 'pasado'
      ? 'Sin cambios en el balance'
      : `${result.delta > 0 ? '+' : ''}${result.delta}¢`;

    return (
      <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
        <div className={`bg-[#301A51] border-4 p-10 flex flex-col items-center gap-6 rounded-xl max-w-sm w-full mx-4 font-pixel [filter:drop-shadow(0_0_15px_rgba(48,26,81,0.7))] ${accentClass}`}>
          <h3 className="text-white text-3xl tracking-[0.2em] text-center uppercase drop-shadow-md">
            DOBLE O NADA
          </h3>
          <div className="w-full border-4 border-white/15 bg-black/20 rounded-lg px-6 py-5 text-center">
            <p className={`text-xl uppercase tracking-[0.18em] ${accentTextClass}`}>
              {headline}
            </p>
            <p className="mt-4 text-white text-sm uppercase tracking-[0.18em]">
              Apuesta: {result.bet}¢
            </p>
            <p className="mt-3 text-2xl text-white uppercase tracking-[0.14em]">
              {detail}
            </p>
          </div>
          <p className="text-white/80 text-[10px] uppercase tracking-[0.25em] animate-pulse text-center">
            Cerrando ronda en breve...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#301A51] border-4 border-[#DF41F9] p-10 flex flex-col items-center gap-8 rounded-xl max-w-sm w-full mx-4 font-pixel [filter:drop-shadow(0_0_15px_rgba(223,65,249,0.7))_drop-shadow(0_0_30px_rgba(223,65,249,0.3))]">
        <h3 className="text-white text-3xl tracking-[0.2em] text-center uppercase drop-shadow-md">
          ¿DOBLE O NADA?
        </h3>

        <div className="flex items-center justify-center gap-4 w-full">
          <PixelButton 
            variant="purple" 
            onClick={handleDecrement}
            disabled={isSubmitting || betAmount <= 0}
            className="w-14 h-14 text-3xl p-0 flex items-center justify-center shadow-[0_6px_0_rgb(88,28,135)] active:translate-y-1 active:shadow-none transition-all"
          >
            -
          </PixelButton>

          <div className="min-w-[160px] h-16 flex flex-col items-center justify-center border-4 border-white/20 bg-black/20 rounded-lg px-4">
            <span className="text-[10px] uppercase tracking-[0.2em] text-white/70">Apuesta</span>
            <span className="text-2xl text-white">{betAmount}¢</span>
          </div>

          <PixelButton 
            variant="purple" 
            onClick={handleIncrement}
            disabled={!canIncreaseBet || isSubmitting || betAmount >= balance}
            className="w-14 h-14 text-3xl p-0 flex items-center justify-center shadow-[0_6px_0_rgb(88,28,135)] active:translate-y-1 active:shadow-none transition-all"
          >
            +
          </PixelButton>
        </div>

        <div className="w-full flex justify-center">
          <PixelButton 
            variant={isPass ? "red" : "green"}
            onClick={handleConfirm}
            disabled={isSubmitting}
            className={`w-full max-w-[220px] px-6 py-4 text-lg tracking-tight min-h-[64px] active:translate-y-1 active:shadow-none transition-all ${
              isPass ? 'shadow-[0_8px_0_rgb(153,27,27)]' : 'shadow-[0_8px_0_rgb(22,101,52)]'
            }`}
          >
            {isSubmitting ? 'RESOLVIENDO...' : isPass ? 'PASAR' : `APOSTAR ${betAmount}¢`}
          </PixelButton>
        </div>

        <div className="flex flex-col items-center gap-2">
            <p className="text-amber-400 text-sm uppercase tracking-widest font-bold">
                Tu Saldo: {balance}¢
            </p>
            {isSubmitting ? (
                <p className="text-white text-[10px] uppercase tracking-tighter animate-pulse">
                    Esperando resultado...
                </p>
            ) : !canIncreaseBet ? (
                <p className="text-red-500 text-[10px] uppercase tracking-tighter animate-pulse">
                    No tienes monedas, solo puedes pasar
                </p>
            ) : isPass ? (
                <p className="text-red-300 text-[10px] uppercase tracking-tighter animate-pulse">
                    Pasar no cambia tu balance
                </p>
            ) : (
                <p className="text-white/70 text-[10px] uppercase tracking-tighter">
                    Ajusta la apuesta y confirma abajo
                </p>
            )}
        </div>
      </div>
    </div>
  );
}
