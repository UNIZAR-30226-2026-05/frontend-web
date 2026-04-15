"use client";

import React from "react";
import PixelButton from "@/components/UI/PixelButton";
import { useGameContext } from "@/features/board/context/GameContext";

interface DobleNadaOverlayProps {
  onClose: () => void;
}

export default function DobleNadaOverlay({ onClose }: DobleNadaOverlayProps) {
  const { myPlayer } = useGameContext();
  const balance = myPlayer?.balance ?? 0;
  const canPlay = balance > 0;
  
  const [betAmount, setBetAmount] = React.useState(canPlay ? 1 : 0);

  const handleIncrement = () => {
    if (!canPlay) return;
    setBetAmount(prev => Math.min(balance, prev + 1));
  };

  const handleDecrement = () => {
    if (!canPlay) return;
    setBetAmount(prev => Math.max(1, prev - 1));
  };

  const handleJugar = () => {
    // In actual implementation, send betAmount to WS
    // e.g. ws.send({ action: 'jugar_doble_nada', payload: { amount: betAmount } })
    onClose();
  };

  const handlePasar = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-[#301A51] border-4 border-[#DF41F9] p-10 flex flex-col items-center gap-8 rounded-xl max-w-sm w-full mx-4 font-pixel [filter:drop-shadow(0_0_15px_rgba(223,65,249,0.7))_drop-shadow(0_0_30px_rgba(223,65,249,0.3))]">
        <h3 className="text-white text-3xl tracking-[0.2em] text-center uppercase drop-shadow-md">
          ¿DOBLE O NADA?
        </h3>

        <div className="flex items-center justify-center gap-4 w-full">
          {/* Botón Purple - (Izquierda) */}
          <PixelButton 
            variant="purple" 
            onClick={handleDecrement}
            disabled={!canPlay || betAmount <= 1}
            className="w-14 h-14 text-3xl p-0 flex items-center justify-center shadow-[0_6px_0_rgb(88,28,135)] active:translate-y-1 active:shadow-none transition-all"
          >
            -
          </PixelButton>

          {/* Botón Central: JUGAR (Verde) con monto o PASAR (Rojo) */}
          {canPlay ? (
            <PixelButton 
              variant="green" 
              onClick={handleJugar}
              className="px-6 py-4 text-xl tracking-tighter min-w-[160px] h-16 shadow-[0_8px_0_rgb(22,101,52)] active:translate-y-1 active:shadow-none transition-all"
            >
              APOSTAR {betAmount}¢
            </PixelButton>
          ) : (
            <PixelButton 
              variant="red" 
              onClick={handlePasar}
              className="px-8 py-4 text-xl tracking-widest min-w-[160px] h-16 shadow-[0_8px_0_rgb(153,27,27)] active:translate-y-1 active:shadow-none transition-all"
            >
              PASAR
            </PixelButton>
          )}

          {/* Botón Purple + (Derecha) */}
          <PixelButton 
            variant="purple" 
            onClick={handleIncrement}
            disabled={!canPlay || betAmount >= balance}
            className="w-14 h-14 text-3xl p-0 flex items-center justify-center shadow-[0_6px_0_rgb(88,28,135)] active:translate-y-1 active:shadow-none transition-all"
          >
            +
          </PixelButton>
        </div>

        <div className="flex flex-col items-center gap-2">
            <p className="text-amber-400 text-sm uppercase tracking-widest font-bold">
                Tu Saldo: {balance}¢
            </p>
            {!canPlay && (
                <p className="text-red-500 text-[10px] uppercase tracking-tighter animate-pulse">
                    No tienes monedas suficientes
                </p>
            )}
        </div>
      </div>
    </div>
  );
}
