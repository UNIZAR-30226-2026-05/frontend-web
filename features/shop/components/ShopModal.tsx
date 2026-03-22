"use client";

import React from 'react';
import PixelButton from '@/components/UI/PixelButton';

interface ShopItem {
  id: number;
  name: string;
  emoji: string;
  price: number;
}

const SHOP_ITEMS: ShopItem[] = [
  { id: 1, name: "Avanzar/Retroceder", emoji: "👞", price: 10 },
  { id: 2, name: "Mejorar/Empeorar dados", emoji: "🎲", price: 15 },
  { id: 3, name: "Barreras de bloqueo", emoji: "🚧", price: 12 },
  { id: 4, name: "Robar monedas", emoji: "💰", price: 20 },
  { id: 5, name: "Ruleta", emoji: "🎡", price: 8 },
  { id: 6, name: "Salvavidas", emoji: "🛟", price: 5 },
  { id: 7, name: "Quitar turno", emoji: "🛑", price: 18 },
];

interface ShopModalProps {
  onClose: () => void;
}

export default function ShopModal({ onClose }: ShopModalProps) {
  const handleBuy = (item: ShopItem) => {
    console.log(`Comprado: ${item.name} por ${item.price}¢`);
    alert(`Has comprado ${item.emoji} ${item.name} por ${item.price}¢`);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      {/* Contenedor del Modal */}
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[var(--color-sp-bg-dark)] border-4 border-white flex flex-col shadow-[0_0_20px_rgba(0,0,0,0.5)]">

        {/* Cabecera */}
        <div className="p-4 border-b-4 border-white flex justify-between items-center bg-[var(--color-sp-bg-medium)]">
          <h2 className="text-2xl font-pixel text-white tracking-widest uppercase">Tienda de Objetos</h2>
          <button
            onClick={onClose}
            className="text-white hover:text-red-400 transition-colors text-3xl font-bold p-2 leading-none"
            aria-label="Cerrar"
          >
            ×
          </button>
        </div>

        {/* Contenido con scroll */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white scrollbar-track-transparent">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {SHOP_ITEMS.map((item) => (
              <div
                key={item.id}
                className="bg-[var(--color-sp-bg-medium)] border-2 border-white p-4 flex flex-col items-center text-center gap-4 hover:bg-[var(--color-sp-bg-light)] transition-colors group"
              >
                <span className="text-6xl group-hover:scale-110 transition-transform duration-200" role="img" aria-label={item.name}>
                  {item.emoji}
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="text-white font-pixel text-sm sm:text-base leading-tight">
                    {item.name}
                  </h3>
                  <p className="text-[var(--color-sp-coin-light)] font-pixel text-lg">
                    {item.price}¢
                  </p>
                </div>
                <PixelButton
                  variant="green"
                  onClick={() => handleBuy(item)}
                  className="w-full text-xs py-2 px-4 h-12"
                >
                  Comprar
                </PixelButton>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
