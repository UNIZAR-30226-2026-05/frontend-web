"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";

type CharacterRole = "banquero" | "escapista" | "vidente" | "videojugador";
type CardSuit = "hearts" | "diamonds" | "spades" | "clubs";

interface MayorMenorUIProps {
  onAction: (result: { score: number }) => void;
  character?: CharacterRole;
  backendCardIndexes?: number[];
  assignedCardSlot?: number;
}

interface Card {
  suit: CardSuit;
  rank: number;
}

const RANDOM_CARD_SUITS: CardSuit[] = ["hearts", "diamonds", "spades", "clubs"];
const BACKEND_CARD_SUITS: CardSuit[] = ["spades", "hearts", "clubs", "diamonds"];

function createRandomCards(): Card[] {
  const pickedCards: Card[] = [];

  while (pickedCards.length < 4) {
    const rank = Math.floor(Math.random() * 13) + 1;
    const suit = RANDOM_CARD_SUITS[Math.floor(Math.random() * RANDOM_CARD_SUITS.length)];

    const isDuplicate = pickedCards.some(card => card.rank === rank && card.suit === suit);
    if (!isDuplicate) {
      pickedCards.push({ rank, suit });
    }
  }

  return pickedCards;
}

function mapBackendIndexToCard(cardIndex: number): Card | null {
  if (!Number.isInteger(cardIndex) || cardIndex < 0 || cardIndex > 51) {
    return null;
  }

  const suit = BACKEND_CARD_SUITS[Math.floor(cardIndex / 13)];
  const rank = (cardIndex % 13) + 1;

  return { suit, rank };
}

function mapBackendCards(cardIndexes?: number[]): Card[] | null {
  if (!Array.isArray(cardIndexes) || cardIndexes.length !== 4) {
    return null;
  }

  const mappedCards = cardIndexes.map(mapBackendIndexToCard);
  if (mappedCards.some(card => card === null)) {
    return null;
  }

  return mappedCards as Card[];
}

export default function MayorMenorUI({ onAction, character, backendCardIndexes, assignedCardSlot }: MayorMenorUIProps) {
  const pathname = usePathname();
  const isDebugRoute = pathname.includes("debug");
  const [selectedCard, setSelectedCard] = useState<number | null>(null);
  const [debugFallbackCards] = useState<Card[]>(() => createRandomCards());

  const [debugCardWidth, setDebugCardWidth] = useState(180);
  const [debugCardGap, setDebugCardGap] = useState(64);
  const [debugFlipDuration, setDebugFlipDuration] = useState(800);
  const [debugBackIndex, setDebugBackIndex] = useState(1);
  const [showDebug, setShowDebug] = useState(true);
  const isDebug = isDebugRoute && showDebug;
  const backendCards = mapBackendCards(backendCardIndexes);
  const isUsingDebugFallback = backendCards === null && isDebugRoute;
  const cardValues = backendCards ?? (isUsingDebugFallback ? debugFallbackCards : []);
  const playerCardSlot =
    typeof assignedCardSlot === "number" && assignedCardSlot >= 0 && assignedCardSlot < cardValues.length
      ? assignedCardSlot
      : null;
  const assignedBackendCard = playerCardSlot !== null ? cardValues[playerCardSlot] ?? null : null;

  const tableBg = character || (isDebug ? "videojugador" : "banquero"); // Default a banquero or similar if not specified

  const handleCardClick = (index: number) => {
    if (selectedCard !== null) return;
    if (cardValues.length === 0) return;
    
    setSelectedCard(index);
    const chosenCard = assignedBackendCard ?? cardValues[index];
    if (!chosenCard) return;

    const score = Math.max(0, Math.min(9999, Math.floor(chosenCard.rank)));
    
    // Esperar a que la animación de giro termine antes de llamar a onAction
    setTimeout(() => {
      onAction({ score });
    }, debugFlipDuration + 100);
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden font-pixel flex flex-col items-center justify-center">
      
      {/* Debug Controls Overlay */}
      {isDebug && (
        <div className="absolute top-4 left-4 z-50 bg-black/80 p-4 border-2 border-amber-500 text-white text-xs flex flex-col gap-2 rounded-lg backdrop-blur-md">
          <div className="font-bold text-amber-500 mb-2 underline">CARDS DEBUGGER</div>
          <div className="flex flex-col">
            <label>Card Width: {debugCardWidth}px</label>
            <input 
              type="range" min="100" max="400" step="4" 
              value={debugCardWidth} onChange={(e) => setDebugCardWidth(parseInt(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>Card Gap: {debugCardGap}px</label>
            <input 
              type="range" min="0" max="100" step="4" 
              value={debugCardGap} onChange={(e) => setDebugCardGap(parseInt(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>Flip Duration: {debugFlipDuration}ms</label>
            <input 
              type="range" min="100" max="2000" step="50" 
              value={debugFlipDuration} onChange={(e) => setDebugFlipDuration(parseInt(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="flex flex-col">
            <label>Card Back: {debugBackIndex}</label>
            <input 
              type="range" min="1" max="8" step="1" 
              value={debugBackIndex} onChange={(e) => setDebugBackIndex(parseInt(e.target.value))}
              className="w-48 appearance-none bg-amber-900/40 h-1 rounded-full cursor-pointer mt-1"
            />
          </div>
          <div className="mt-2 p-2 bg-white/10 rounded font-mono text-[9px]">
            cardWidth: {debugCardWidth},<br/>
            cardGap: {debugCardGap},<br/>
            flipDuration: {debugFlipDuration},<br/>
            backIdx: {debugBackIndex}
          </div>
          <div className="flex gap-2 mt-2">
            <button 
              onClick={() => setShowDebug(false)}
              className="flex-1 text-[10px] bg-red-500/20 hover:bg-red-500/40 py-1 rounded transition-colors"
            >
              HIDE
            </button>
          </div>
        </div>
      )}

      {/* Fondo de la Mesa según el Personaje */}
      <div className="absolute inset-0 z-0">
        <Image 
          src={`/minijuegos/carta_alta/mesa_${tableBg}.png`} 
          alt={`Mesa de ${tableBg}`} 
          fill 
          className="object-cover"
          unoptimized
        />
        <div className="absolute inset-0 bg-black/20" />
      </div>

      {/* Cartas Centradas Horizontalmente */}
      {cardValues.length === 0 ? (
        <div className="relative z-10 mx-6 max-w-xl rounded-lg border-2 border-red-400 bg-black/80 px-6 py-5 text-center text-white backdrop-blur-md">
          <p className="text-lg uppercase tracking-[0.2em] text-red-300">Esperando cartas del backend</p>
          <p className="mt-3 text-sm text-white/80">
            Este minijuego necesita recibir `detalles.cartas` por websocket antes de poder jugarse.
          </p>
        </div>
      ) : (
        <>

          <div 
            className="relative z-10 flex flex-row w-full max-w-6xl px-8 justify-center items-center"
            style={{ gap: `${debugCardGap}px` }}
          >
            {Array.from({ length: 4 }).map((_, i) => {
              const card = cardValues[i];
              const revealedCard = selectedCard === i ? (assignedBackendCard ?? card) : card;

              return (
                <div 
                  key={i}
                  className={`relative group aspect-[3/4.5] perspective-1000
                    ${selectedCard !== null && selectedCard !== i ? "opacity-30 scale-90 grayscale" : "opacity-100 scale-100"}
                    cursor-pointer
                    transition-all duration-500`}
                  style={{ width: `${debugCardWidth}px` }}
                  onClick={() => handleCardClick(i)}
                >
                  <div 
                    className={`relative w-full h-full transition-transform preserve-3d
                      ${selectedCard === i ? "rotate-y-180" : "hover:scale-105 active:scale-95"}`}
                    style={{ transitionDuration: `${debugFlipDuration}ms` }}
                  >
                    <div className="absolute inset-0 backface-hidden flex items-center justify-center overflow-hidden">
                      <Image
                        src="/minijuegos/carta_alta/reverso_carta.png"
                        alt="Dorso de carta"
                        className="w-full h-full object-contain"
                        style={{ imageRendering: 'pixelated' }}
                        width={debugCardWidth}
                        height={debugCardWidth * 4.5 / 3}
                      />
                    </div>

                    <div className="absolute inset-0 backface-hidden rotate-y-180 flex flex-col items-center justify-center overflow-hidden">
                      {revealedCard && (
                        <Image 
                          src={`/minijuegos/carta_alta/cards/card_${revealedCard.suit}_${revealedCard.rank}.png`}
                          alt={`Carta ${revealedCard.rank} de ${revealedCard.suit}`}
                          className="w-full h-full object-contain"
                          style={{ imageRendering: 'pixelated' }}
                          width={debugCardWidth}
                          height={debugCardWidth * 4.5 / 3}
                        />
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      <style jsx>{`
        .perspective-1000 { perspective: 1000px; }
        .preserve-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        img { image-rendering: pixelated !important; image-rendering: crisp-edges !important; }
      `}</style>
    </div>
  );
}
