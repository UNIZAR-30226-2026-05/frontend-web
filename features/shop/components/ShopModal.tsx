"use client";

import React, { } from 'react';
import PixelButton from '@/components/UI/PixelButton';
import { useGameContext } from '@/features/board/context/GameContext';
import { getGameSocket } from '@/lib/gameSocket';
import Image from 'next/image';

interface ShopItem {
  id: number;
  name: string;       // nombre exacto de BD
  image: string;
  price: number;
  description: string;
}

const SHOP_ITEMS: ShopItem[] = [
  { id: 1, name: "Avanzar Casillas", image: "/items/item_avanzar.png", price: 1, description: "Avanza una casilla extra tras tirar los dados" },
  { id: 2, name: "Mejorar Dados", image: "/items/item_dados.png", price: 3, description: "Mejora tu segundo dado un nivel para esta tirada" },
  { id: 3, name: "Barrera", image: "/items/item_barrera.png", price: 10, description: "Añade un turno de penalización al jugador elegido" },
  { id: 4, name: "Salvavidas bloqueo", image: "/items/item_salvavidas.png", price: 10, description: "Anula el efecto de una casilla de bloqueo (este objeto no anula la barrera impuesta por otro jugador)" },
];

interface ShopModalProps {
  onClose: () => void;
}

export default function ShopModal({ onClose }: ShopModalProps) {
  const { myPlayer, state, markItemPurchased, dispatch } = useGameContext();

  const penaltyTurns = state.penaltyTurns;
  const isBlocked = penaltyTurns > 0;
  const hasRolled = state.hasMoved;

  // Calcular ranking por posición en el tablero
  const sortedPlayers = Object.values(state.players).sort((a, b) => b.position - a.position);
  const myRank = sortedPlayers.findIndex(p => p.username === state.myUsername) + 1;
  const isFirstPlace = myRank === 1 && state.myUsername !== null;

  const handleBuy = (item: ShopItem) => {
    const ws = getGameSocket();
    if (!ws || ws.readyState !== WebSocket.OPEN) return;
    if (!myPlayer || myPlayer.balance < item.price) return;

    const isSalvavidas = item.name === 'Salvavidas bloqueo';
    const isBarrera = item.name === 'Barrera';

    if (isSalvavidas) {
      // El backend gestiona compra y uso en un único action
      ws.send(JSON.stringify({ action: 'usar_salvavidas', payload: { objeto: item.name } }));
    } else if (isBarrera) {
      ws.send(JSON.stringify({ action: 'comprar_objeto', payload: { objeto: item.name } }));
      // En lugar de usarlo inmediatamente, abrimos el modal de selección de objetivo
      dispatch({ type: 'SET_SHOW_BARRERA_MODAL', value: true });
      onClose(); // Cerramos la tienda para que se vea el modal de selección
    } else {
      ws.send(JSON.stringify({ action: 'comprar_objeto', payload: { objeto: item.name } }));
      ws.send(JSON.stringify({ action: 'usar_objeto', payload: { objeto: item.name } }));
    }
    markItemPurchased(item.name);
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
              X
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

        {/* Banner de dados ya tirados */}
        {!isBlocked && hasRolled && (
          <div className="px-6 py-3 bg-yellow-900/70 border-b-4 border-yellow-600 text-center">
            <p className="text-yellow-200 font-pixel text-sm tracking-wide">
              Ya has tirado los dados. Los objetos solo se pueden comprar antes de tirar.
            </p>
          </div>
        )}

        {/* Contenido (Items) */}
        <div className="p-8 overflow-x-auto min-h-[400px]">
          <div className="flex flex-row justify-center gap-6 min-w-max md:min-w-0">
            {SHOP_ITEMS.map((item) => {
              const purchaseCount = state.purchasedItems[item.name] ?? 0;
              const isAvanzar = item.name === 'Avanzar Casillas';
              const isMejorarDados = item.name === 'Mejorar Dados';
              const isSalvavidasBloqueo = item.name === 'Salvavidas bloqueo';

              const disabled =
                (isSalvavidasBloqueo ? !isBlocked : isBlocked) ||
                (isAvanzar && state.hasMoved) ||
                (isMejorarDados && isFirstPlace);

              const disabledReason =
                (isBlocked && !isSalvavidasBloqueo) ? 'BLOQUEADO' :
                  (isMejorarDados && isFirstPlace) ? 'BLOQUEADO: VAS 1º' :
                    (isAvanzar && state.hasMoved) ? 'Solo antes de tirar' :
                      (isSalvavidasBloqueo && !isBlocked) ? 'No estás bloqueado' :
                        '';

              return (
                <div
                  key={item.id}
                  className={`flex-1 w-64 bg-slate-800 border-4 ${disabled ? 'border-slate-700 opacity-60' : 'border-white hover:border-amber-400 hover:bg-slate-700'} p-6 flex flex-col items-center text-center gap-4 transition-all duration-200 group relative`}
                >
                  <div className="relative mb-2">
                    <div className="relative w-24 h-24 group-hover:scale-110 transition-transform duration-300">
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-contain pixelated"
                        unoptimized
                      />
                    </div>
                    {purchaseCount > 0 && (
                      <span className="absolute -top-2 -right-3 bg-yellow-400 text-black font-pixel text-xs px-1.5 py-0.5 border-2 border-black shadow-lg">
                        x{purchaseCount}
                      </span>
                    )}
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
