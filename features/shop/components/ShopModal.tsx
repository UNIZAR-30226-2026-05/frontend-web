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
  { id: 4, name: "Salvavidas movimiento", emoji: "🛟", price: 5,  description: "Anula el efecto de una casilla de movimiento" },
  { id: 5, name: "Salvavidas bloqueo",    emoji: "🔒", price: 10, description: "Anula el efecto de una casilla de bloqueo" },
];

interface ShopModalProps {
  onClose: () => void;
}

export default function ShopModal({ onClose }: ShopModalProps) {
  const { myPlayer, state } = useGameContext();
  // Contador local: cuántos "Avanzar Casillas" se han comprado en este turno (solo UX)
  const [avanzarCount, setAvanzarCount] = useState(0);
  const penaltyTurns = state.penaltyTurns;
  const isBlocked = penaltyTurns > 0;

  const handleBuy = (item: ShopItem) => {
    const ws = getGameSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) {
      console.warn('WebSocket no disponible para comprar_objeto');
      return;
    }
    if (!myPlayer || myPlayer.balance < item.price) return;

    const isSalvavidas = item.name === 'Salvavidas movimiento' || item.name === 'Salvavidas bloqueo';
    if (isSalvavidas) {
      // El backend gestiona compra y uso en un único action
      ws.send(JSON.stringify({ action: 'usar_salvavidas', payload: { objeto: item.name } }));
    } else {
      ws.send(JSON.stringify({ action: 'comprar_objeto', payload: { objeto: item.name } }));
      // Uso instantáneo: el objeto no se guarda en inventario, se usa en el momento de comprarlo
      ws.send(JSON.stringify({ action: 'usar_objeto', payload: { objeto: item.name } }));
      if (item.name === 'Avanzar Casillas') {
        setAvanzarCount(prev => prev + 1);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      {/* Contenedor del Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--color-sp-bg-dark)] border-4 border-white flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.5)]">

        {/* Cabecera */}
        <div className="p-4 border-b-4 border-white flex justify-between items-center bg-[var(--color-sp-bg-medium)]">
          <h2 className="text-2xl font-pixel text-white tracking-widest uppercase">Tienda de Objetos</h2>
          <div className="flex items-center gap-4">
            {myPlayer && (
              <span className="text-[var(--color-sp-coin-light)] font-pixel text-lg">
                {myPlayer.balance}¢
              </span>
            )}
            <button
              onClick={onClose}
              className="text-white hover:text-red-400 transition-colors text-3xl font-bold p-2 leading-none"
              aria-label="Cerrar"
            >
              ×
            </button>
          </div>
        </div>

        {/* Banner de bloqueo por penalización */}
        {isBlocked && (
          <div className="px-6 py-3 bg-red-900/70 border-b-4 border-red-500 text-center">
            <p className="text-[#ffb3b3] font-pixel text-sm tracking-wide">
              Estás bloqueado — {penaltyTurns} turno{penaltyTurns > 1 ? 's' : ''} restante{penaltyTurns > 1 ? 's' : ''}. No puedes comprar objetos.
            </p>
          </div>
        )}

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white scrollbar-track-transparent">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SHOP_ITEMS.map((item) => {
              const isAvanzar = item.name === 'Avanzar Casillas';
              const isSalvavidasMov = item.name === 'Salvavidas movimiento';
              const isSalvavidasBloqueo = item.name === 'Salvavidas bloqueo';

              // Bloqueado globalmente si hay penalización activa
              // Avanzar: solo antes de tirar
              // Salvavidas: solo tras tirar Y haber caído en la casilla correspondiente
              const disabled =
                isBlocked ||
                (isAvanzar && state.hasMoved) ||
                (isSalvavidasMov && (!state.hasMoved || !state.landedOnNegativeMove)) ||
                (isSalvavidasBloqueo && (!state.hasMoved || !state.landedOnBarrera));

              const disabledReason =
                isBlocked ? '' : // el banner ya lo explica
                isAvanzar ? 'Solo antes de tirar' :
                isSalvavidasMov ? (state.hasMoved ? 'No caíste en casilla negativa' : 'Solo tras tirar los dados') :
                isSalvavidasBloqueo ? (state.hasMoved ? 'No caíste en barrera' : 'Solo tras tirar los dados') :
                '';

              return (
                <div
                  key={item.id}
                  className="bg-[var(--color-sp-bg-medium)] border-2 border-white p-4 flex flex-col items-center text-center gap-4 hover:bg-[var(--color-sp-bg-light)] transition-colors group"
                >
                  <div className="relative inline-block">
                    <span className="text-6xl group-hover:scale-110 transition-transform duration-200" role="img" aria-label={item.name}>
                      {item.emoji}
                    </span>
                    {isAvanzar && avanzarCount > 0 && (
                      <span className="absolute -top-2 -right-3 bg-yellow-400 text-black font-pixel text-xs px-1.5 py-0.5">
                        ×{avanzarCount}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h3 className="text-white font-pixel text-sm sm:text-base leading-tight">
                      {item.name}
                    </h3>
                    <p className="text-[var(--color-sp-text-light)]/70 font-pixel text-[10px] leading-tight">
                      {item.description}
                    </p>
                    <p className="text-[var(--color-sp-coin-light)] font-pixel text-lg">
                      {item.price}¢
                    </p>
                  </div>
                  <PixelButton
                    variant="green"
                    onClick={() => handleBuy(item)}
                    disabled={disabled}
                    className="w-full text-xs py-2 px-4 h-12 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    Comprar
                  </PixelButton>
                  {disabled && (
                    <p className="text-[#ffb3b3] font-pixel text-[9px] -mt-2">
                      {disabledReason}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
