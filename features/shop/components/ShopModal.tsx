"use client";

import React, { useState } from 'react';
import PixelButton from '@/components/UI/PixelButton';
import { useGameContext } from '@/features/board/context/GameContext';
import { getGameSocket } from '@/lib/gameSocket';

interface ShopItem {
  id: number;
  name: string;       // nombre exacto de BD
  emoji: string;
  price: number;
  description: string;
}

const SHOP_ITEMS: ShopItem[] = [
  { id: 1, name: "Avanzar Casillas",      emoji: "👞", price: 1,  description: "Avanza una casilla extra tras tirar los dados" },
  { id: 2, name: "Mejorar Dados",          emoji: "🎲", price: 3,  description: "Mejora tu segundo dado un nivel para esta tirada" },
  { id: 3, name: "Barrera",               emoji: "🚧", price: 10, description: "Añade un turno de penalización al jugador elegido" },
  { id: 5, name: "Salvavidas bloqueo",    emoji: "🔒", price: 10, description: "Anula el efecto de una casilla de bloqueo" },
];

interface ShopModalProps {
  onClose: () => void;
}

export default function ShopModal({ onClose }: ShopModalProps) {
  const { myPlayer, state } = useGameContext();
  const [avanzarCount, setAvanzarCount] = useState(0);
  const penaltyTurns = state.penaltyTurns;
  const isBlocked = penaltyTurns > 0;

  // Calcular ranking por posición en el tablero
  const sortedPlayers = Object.values(state.players).sort((a, b) => b.position - a.position);
  const myRank = sortedPlayers.findIndex(p => p.username === state.myUsername) + 1;
  const isFirstPlace = myRank === 1 && state.myUsername !== null;

  const handleBuy = (item: ShopItem) => {
    const ws = getGameSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (!myPlayer || myPlayer.balance < item.price) return;

    if (item.name === 'Salvavidas bloqueo') {
      ws.send(JSON.stringify({ action: 'usar_salvavidas', payload: { objeto: item.name } }));
    } else {
      ws.send(JSON.stringify({ action: 'comprar_objeto', payload: { objeto: item.name } }));
      ws.send(JSON.stringify({ action: 'usar_objeto', payload: { objeto: item.name } }));
      if (item.name === 'Avanzar Casillas') {
        setAvanzarCount(prev => prev + 1);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-300">
      <div className="relative w-full max-w-6xl bg-slate-900 border-4 border-white flex flex-col shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden rounded-xl">

        {/* Cabecera */}
        <div className="p-6 border-b-4 border-white flex justify-between items-center bg-slate-800">
          <div className="flex flex-col gap-1">
            <h2 className="text-3xl font-pixel text-white tracking-[0.2em] uppercase">Tienda de Objetos</h2>
            <p className="text-white/40 font-pixel text-xs uppercase tracking-widest">
                Equípate para la victoria en Snow Party
            </p>
          </div>
          <div className="flex items-center gap-6">
            {myPlayer && (
              <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-lg border-2 border-amber-500/30">
                <span className="text-amber-400 font-pixel text-2xl drop-shadow-md">
                    {myPlayer.balance}¢
                </span>
              </div>
            )}
            <button
              onClick={onClose}
              className="text-white hover:text-red-500 transition-colors text-4xl font-bold leading-none p-2"
            >
              ×
            </button>
          </div>
        </div>

        {/* Banner de bloqueo por penalización */}
        {isBlocked && (
          <div className="px-6 py-4 bg-red-950/80 border-b-4 border-red-500 text-center animate-in slide-in-from-top duration-300">
            <p className="text-red-200 font-pixel text-sm tracking-widest uppercase">
              ESTÁS BLOQUEADO — {penaltyTurns} TURNO{penaltyTurns > 1 ? 'S' : ''} RESTANTE{penaltyTurns > 1 ? 'S' : ''}
            </p>
          </div>
        )}

        {/* Contenido (4 items en horizontal) */}
        <div className="p-8 overflow-x-auto">
          <div className="flex flex-row justify-center gap-6 min-w-max md:min-w-0">
            {SHOP_ITEMS.map((item) => {
              const isAvanzar = item.name === 'Avanzar Casillas';
              const isMejorarDados = item.name === 'Mejorar Dados';
              const isSalvavidasBloqueo = item.name === 'Salvavidas bloqueo';

              const disabled =
                isBlocked ||
                (isAvanzar && state.hasMoved) ||
                (isMejorarDados && isFirstPlace) ||
                (isSalvavidasBloqueo && (!state.hasMoved || !state.landedOnBarrera));

              const disabledReason =
                isBlocked ? '' :
                (isMejorarDados && isFirstPlace) ? 'BLOQUEADO: VAS 1º' :
                isAvanzar ? 'Solo antes de tirar' :
                isSalvavidasBloqueo ? (state.hasMoved ? 'No caíste en barrera' : 'Solo tras tirar') :
                '';

              return (
                <div
                  key={item.id}
                  className={`flex-1 w-64 bg-slate-800 border-4 ${disabled ? 'border-slate-700 opacity-60' : 'border-white hover:border-amber-400 hover:bg-slate-700'} p-6 flex flex-col items-center text-center gap-4 transition-all duration-200 group relative`}
                >
                  <div className="relative mb-2">
                    <span className="text-7xl group-hover:scale-110 transition-transform duration-300 block" role="img">
                      {item.emoji}
                    </span>
                    {isFirstPlace && isMejorarDados && (
                        <div className="absolute top-0 left-0 w-full h-full flex items-center justify-center rotate-[-15deg]">
                            <div className="bg-red-600 text-white font-pixel text-[10px] px-2 py-1 border-2 border-white shadow-xl">PROHIBIDO</div>
                        </div>
                    )}
                  </div>
                  
                  <div className="flex-1 flex flex-col gap-2">
                    <h3 className="text-white font-pixel text-lg leading-tight uppercase tracking-wider">
                      {item.name}
                    </h3>
                    <p className="text-slate-400 font-pixel text-[10px] leading-relaxed line-clamp-3">
                      {item.description}
                    </p>
                    <p className="text-amber-400 font-pixel text-2xl mt-auto drop-shadow-md">
                      {item.price}¢
                    </p>
                  </div>

                  <PixelButton
                    variant={disabled ? "purple" : "green"}
                    onClick={() => handleBuy(item)}
                    disabled={disabled}
                    className="w-full text-xs py-3 px-2 h-14"
                  >
                    {disabled ? "BLOQUEADO" : "COMPRAR"}
                  </PixelButton>

                  {disabledReason && (
                    <p className="text-red-400 font-pixel text-[9px] uppercase tracking-tighter">
                      {disabledReason}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Footer simple */}
        <div className="p-4 bg-slate-950/50 text-center border-t-4 border-white/10">
            <p className="text-white/20 font-pixel text-[9px] uppercase tracking-[0.3em]">
                Snow Party Store • In-Game Items Only
            </p>
        </div>
      </div>
    </div>
  );
}
